
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
  const [loading, setLoading] = useState(true);
  const { webApp, isReady: telegramReady, user: telegramUser } = useTelegramWebApp();

  useEffect(() => {
    console.log('🔄 AuthWrapper useEffect запускается...');
    
    const initializeUser = async () => {
      try {
        console.log('⚡ Начинаем инициализацию пользователя...');
        console.log('📱 Telegram готов:', telegramReady);
        console.log('👤 Telegram пользователь:', telegramUser);
        
        // Ждем готовности Telegram WebApp (или таймаут для веб-версии)
        if (!telegramReady) {
          console.log('⏳ Ожидаем готовности Telegram WebApp...');
          return;
        }

        // Проверяем сохраненного пользователя в localStorage
        const savedUser = localStorage.getItem('roller_tricks_user');
        console.log('💾 Сохраненный пользователь:', savedUser ? 'найден' : 'не найден');
        
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            console.log('⚡ Быстрая загрузка пользователя:', userData.username || userData.first_name);
            setUser(userData);
            
            // Проверяем актуальность данных если есть Telegram пользователь
            if (telegramUser && telegramUser.id.toString() === userData.telegram_id) {
              console.log('🔄 Обновляем данные пользователя из Telegram...');
              await updateUserFromTelegram(telegramUser, userData.id);
            }
            
            setLoading(false);
            return;
          } catch (parseError) {
            console.error('❌ Ошибка парсинга сохраненного пользователя:', parseError);
            localStorage.removeItem('roller_tricks_user');
          }
        }

        // Если есть данные из Telegram WebApp
        if (telegramUser) {
          console.log('👤 Создаем/обновляем пользователя из Telegram:', {
            id: telegramUser.id,
            first_name: telegramUser.first_name,
            username: telegramUser.username
          });
          
          await createOrUpdateUser(telegramUser);
          return;
        }

        // Создаем администратора для разработки/веб-версии
        console.log('🔧 Создаем администратора для веб-версии');
        await createAdminUser();

      } catch (err: any) {
        console.error('❌ Критическая ошибка инициализации:', err);
        await createAdminUser();
      } finally {
        console.log('✅ Завершаем инициализацию, убираем loading');
        setLoading(false);
      }
    };

    // Инициализируем когда Telegram WebApp готов или через таймаут
    if (telegramReady) {
      initializeUser();
    }
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

      if (error) {
        console.error('❌ Ошибка обновления пользователя:', error);
      } else {
        console.log('✅ Данные пользователя обновлены');
        
        // Обновляем локальные данные
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
      console.error('❌ Ошибка обновления пользователя из Telegram:', error);
    }
  };

  const createOrUpdateUser = async (telegramUser: any) => {
    try {
      const telegramId = telegramUser.id.toString();
      console.log('🔍 Ищем пользователя с Telegram ID:', telegramId);
      
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      console.log('🔍 Результат поиска:', { найден: !!existingProfile, ошибка: !!profileError });

      let profileId = existingProfile?.id;

      if (!existingProfile) {
        // Создаем новый профиль
        const newUserId = crypto.randomUUID();
        
        console.log('➕ Создаем профиль с ID:', newUserId);
        
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

        console.log('✅ Профиль создан');

        // Создаем запись в user_points
        const { error: pointsError } = await supabase
          .from('user_points')
          .insert({
            user_id: newUserId,
            total_points: 0,
            wins_count: 0,
          });

        if (pointsError) {
          console.error('❌ Ошибка создания points:', pointsError);
        }

        profileId = newUserId;
      } else if (profileError) {
        console.error('❌ Ошибка поиска профиля:', profileError);
        throw profileError;
      } else {
        // Обновляем существующий профиль
        console.log('🔄 Обновляем существующий профиль:', existingProfile.id);
        await updateUserFromTelegram(telegramUser, existingProfile.id);
        profileId = existingProfile.id;
      }

      // Устанавливаем пользователя в контекст
      const userData = {
        id: profileId,
        telegram_id: telegramId,
        username: telegramUser.username || `user_${telegramUser.id}`,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        avatar_url: telegramUser.photo_url,
        telegram_username: telegramUser.username,
      };

      console.log('✅ Устанавливаем пользователя:', userData.username || userData.first_name);
      
      setUser(userData);
      localStorage.setItem('roller_tricks_user', JSON.stringify(userData));

    } catch (err: any) {
      console.error('❌ Ошибка работы с пользователем:', err);
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

        console.log('✅ Админский профиль создан:', newAdmin);

        const { error: pointsError } = await supabase
          .from('user_points')
          .insert({
            user_id: newAdminId,
            total_points: 99999,
            wins_count: 100,
          });

        if (pointsError) {
          console.error('❌ Ошибка создания points для админа:', pointsError);
        }

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
