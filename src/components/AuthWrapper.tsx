
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

interface User {
  id: string;
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  telegram_username?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => void;
  signIn: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: () => {},
  signIn: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthWrapper');
  }
  return context;
};

interface AuthWrapperProps {
  children: React.ReactNode | ((props: { user: User | null; loading: boolean }) => React.ReactNode);
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const { webApp, isReady: telegramReady, user: telegramUser } = useTelegramWebApp();

  useEffect(() => {
    console.log('🔄 AuthWrapper инициализация...');
    
    const initializeUser = async () => {
      try {
        // Проверяем сохраненного пользователя в localStorage для быстрого отображения
        const savedUser = localStorage.getItem('roller_tricks_user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            console.log('⚡ Мгновенная загрузка пользователя:', userData.username || userData.first_name);
            setUser(userData);
          } catch (parseError) {
            console.error('❌ Ошибка парсинга сохраненного пользователя:', parseError);
            localStorage.removeItem('roller_tricks_user');
          }
        }

        // Если нет сохраненных данных, создаем пользователя сразу
        if (!savedUser) {
          // Проверяем данные из Telegram WebApp
          if (telegramUser && telegramReady) {
            console.log('👤 Создаем пользователя из Telegram WebApp:', telegramUser);
            await createOrUpdateUser(telegramUser);
          } else {
            // Создаем админа для веб-версии без ожидания
            console.log('🔧 Создаем админа для веб-версии');
            await createAdminUser();
          }
        } else if (telegramUser && telegramReady) {
          // Асинхронно обновляем данные если есть Telegram пользователь
          const userData = JSON.parse(savedUser);
          if (telegramUser.id.toString() === userData.telegram_id) {
            console.log('🔄 Асинхронно обновляем данные пользователя из Telegram...');
            updateUserFromTelegram(telegramUser, userData.id);
          }
        }

      } catch (err: any) {
        console.error('❌ Ошибка инициализации:', err);
        // В случае ошибки создаем fallback пользователя
        const fallbackUser = {
          id: crypto.randomUUID(),
          telegram_id: 'fallback_user',
          username: 'User',
          first_name: 'Guest',
          last_name: 'User',
          avatar_url: '',
          telegram_username: 'User',
        };
        setUser(fallbackUser);
        localStorage.setItem('roller_tricks_user', JSON.stringify(fallbackUser));
      }
    };

    // Запускаем инициализацию сразу
    initializeUser();
  }, [telegramReady, telegramUser]);

  const updateUserFromTelegram = async (telegramUser: any, userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: telegramUser.username || `user_${telegramUser.id}`,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          avatar_url: telegramUser.photo_url,
          telegram_username: telegramUser.username,
          telegram_photo_url: telegramUser.photo_url,
        })
        .eq('id', userId);

      if (!error) {
        console.log('✅ Данные пользователя обновлены асинхронно');
        
        const updatedUser = {
          id: userId,
          telegram_id: telegramUser.id.toString(),
          username: telegramUser.username || `user_${telegramUser.id}`,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          avatar_url: telegramUser.photo_url,
          telegram_username: telegramUser.username,
        };
        
        setUser(updatedUser);
        localStorage.setItem('roller_tricks_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('❌ Ошибка асинхронного обновления пользователя:', error);
    }
  };

  const createOrUpdateUser = async (telegramUser: any) => {
    try {
      const telegramId = telegramUser.id.toString();
      console.log('🔍 Создаем/ищем пользователя с Telegram ID:', telegramId);
      
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      let profileId = existingProfile?.id;

      if (!existingProfile) {
        const newUserId = crypto.randomUUID();
        
        console.log('➕ Создаем новый профиль с ID:', newUserId);
        
        const { data: newProfile, error: insertProfileError } = await supabase
          .from('profiles')
          .insert({
            id: newUserId,
            username: telegramUser.username || `user_${telegramUser.id}`,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            avatar_url: telegramUser.photo_url,
            telegram_id: telegramId,
            telegram_username: telegramUser.username,
            telegram_photo_url: telegramUser.photo_url,
          })
          .select()
          .single();

        if (insertProfileError) {
          console.error('❌ Ошибка создания профиля:', insertProfileError);
          throw insertProfileError;
        }

        // Создаем запись в user_points асинхронно
        (async () => {
          try {
            await supabase
              .from('user_points')
              .insert({
                user_id: newUserId,
                total_points: 0,
                wins_count: 0,
              });
            console.log('✅ User points created');
          } catch (err) {
            console.error('❌ Error creating points:', err);
          }
        })();

        profileId = newUserId;
      } else if (profileError) {
        console.error('❌ Ошибка поиска профиля:', profileError);
        throw profileError;
      } else {
        // Асинхронно обновляем существующий профиль
        updateUserFromTelegram(telegramUser, existingProfile.id);
        profileId = existingProfile.id;
      }

      // Устанавливаем пользователя мгновенно
      const userData = {
        id: profileId,
        telegram_id: telegramId,
        username: telegramUser.username || `user_${telegramUser.id}`,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        avatar_url: telegramUser.photo_url,
        telegram_username: telegramUser.username,
      };

      console.log('✅ Мгновенно устанавливаем пользователя:', userData.username || userData.first_name);
      
      setUser(userData);
      localStorage.setItem('roller_tricks_user', JSON.stringify(userData));

    } catch (err: any) {
      console.error('❌ Ошибка создания пользователя:', err);
      await createAdminUser();
    }
  };

  const createAdminUser = async () => {
    try {
      console.log('👑 Создаем админский аккаунт');
      
      const { data: existingAdmin, error: adminError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', 'TrickMaster')
        .maybeSingle();

      let adminId = existingAdmin?.id;

      if (!existingAdmin && (!adminError || adminError.code === 'PGRST116')) {
        const newAdminId = crypto.randomUUID();
        
        console.log('➕ Создаем админский профиль с ID:', newAdminId);
        
        const { data: newAdmin, error: insertAdminError } = await supabase
          .from('profiles')
          .insert({
            id: newAdminId,
            username: 'TrickMaster',
            first_name: 'Admin',
            last_name: 'Master',
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            telegram_id: 'admin_web',
            telegram_username: 'TrickMaster',
            telegram_photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          })
          .select()
          .single();

        if (insertAdminError) {
          console.error('❌ Ошибка создания админского профиля:', insertAdminError);
          throw insertAdminError;
        }

        // Создаем user_points асинхронно
        (async () => {
          try {
            await supabase
              .from('user_points')
              .insert({
                user_id: newAdminId,
                total_points: 99999,
                wins_count: 100,
              });
            console.log('✅ Admin points created');
          } catch (err) {
            console.error('❌ Error creating admin points:', err);
          }
        })();

        adminId = newAdminId;
      } else if (adminError) {
        console.error('❌ Ошибка при поиске админского профиля:', adminError);
        throw adminError;
      } else {
        adminId = existingAdmin.id;
      }

      const adminData = {
        id: adminId,
        telegram_id: 'admin_web',
        username: 'TrickMaster',
        first_name: 'Admin',
        last_name: 'Master',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        telegram_username: 'TrickMaster',
      };

      console.log('✅ Устанавливаем админа:', adminData);
      
      setUser(adminData);
      localStorage.setItem('roller_tricks_user', JSON.stringify(adminData));

    } catch (err: any) {
      console.error('❌ Admin auth error:', err);
      const fallbackUser = {
        id: crypto.randomUUID(),
        telegram_id: 'fallback_user',
        username: 'User',
        first_name: 'Guest',
        last_name: 'User',
        avatar_url: '',
        telegram_username: 'User',
      };
      setUser(fallbackUser);
      localStorage.setItem('roller_tricks_user', JSON.stringify(fallbackUser));
    }
  };

  const signIn = (userData: any) => {
    console.log('🔐 Вход пользователя:', userData.username || userData.first_name);
    setUser(userData);
    localStorage.setItem('roller_tricks_user', JSON.stringify(userData));
  };

  const signOut = () => {
    console.log('🚪 Выход пользователя');
    setUser(null);
    localStorage.removeItem('roller_tricks_user');
  };

  const contextValue = { user, loading, signOut, signIn };

  return (
    <AuthContext.Provider value={contextValue}>
      {typeof children === 'function' ? children({ user, loading }) : children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;
