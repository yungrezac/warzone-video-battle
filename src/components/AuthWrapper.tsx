
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [loading, setLoading] = useState(false); // Убираем состояние загрузки

  useEffect(() => {
    console.log('🚀 AuthWrapper мгновенная инициализация...');
    
    const initializeUser = async () => {
      try {
        // Быстро проверяем сохраненного пользователя
        const savedUser = localStorage.getItem('roller_tricks_user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            console.log('⚡ Мгновенная загрузка из localStorage:', userData.username || userData.first_name);
            setUser(userData);
            
            // Асинхронно обновляем данные из Telegram в фоне
            updateUserInBackground();
            return;
          } catch (parseError) {
            console.error('❌ Ошибка парсинга:', parseError);
            localStorage.removeItem('roller_tricks_user');
          }
        }

        // Если нет сохраненного пользователя, создаем быстро
        await createUserFast();

      } catch (err: any) {
        console.error('❌ Ошибка инициализации:', err);
        // Создаем fallback пользователя для продолжения работы
        createFallbackUser();
      }
    };

    const updateUserInBackground = async () => {
      // Фоновое обновление данных из Telegram без блокировки UI
      try {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
          const telegramUser = window.Telegram.WebApp.initDataUnsafe.user;
          console.log('🔄 Фоновое обновление из Telegram...');
          
          // Обновляем в базе асинхронно
          const savedUser = localStorage.getItem('roller_tricks_user');
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            updateUserFromTelegram(telegramUser, userData.id);
          }
        }
      } catch (error) {
        console.log('⚠️ Фоновое обновление не удалось:', error);
      }
    };

    const createUserFast = async () => {
      console.log('➕ Быстрое создание пользователя...');
      
      // Сначала проверяем Telegram пользователя
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const telegramUser = window.Telegram.WebApp.initDataUnsafe.user;
        await createTelegramUser(telegramUser);
      } else {
        // Создаем админа для веб-версии
        await createAdminUser();
      }
    };

    const createTelegramUser = async (telegramUser: any) => {
      const telegramId = telegramUser.id.toString();
      console.log('👤 Создаем Telegram пользователя:', telegramId);
      
      try {
        // Быстрая проверка существования
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url, telegram_id, telegram_username')
          .eq('telegram_id', telegramId)
          .maybeSingle();

        let profileId = existingProfile?.id;

        if (!existingProfile) {
          // Создаем нового пользователя
          const newUserId = crypto.randomUUID();
          
          const { error: insertError } = await supabase
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
            });

          if (!insertError) {
            profileId = newUserId;
            
            // Создаем user_points в фоне
            (async () => {
              try {
                await supabase.from('user_points').insert({
                  user_id: newUserId,
                  total_points: 0,
                  wins_count: 0,
                });
              } catch (err) {
                console.error('❌ Error creating points:', err);
              }
            })();
          }
        }

        // Мгновенно устанавливаем пользователя
        const userData = {
          id: profileId!,
          telegram_id: telegramId,
          username: telegramUser.username || `user_${telegramUser.id}`,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          avatar_url: telegramUser.photo_url,
          telegram_username: telegramUser.username,
        };

        console.log('✅ Telegram пользователь готов:', userData.username || userData.first_name);
        setUser(userData);
        localStorage.setItem('roller_tricks_user', JSON.stringify(userData));

      } catch (error) {
        console.error('❌ Ошибка создания Telegram пользователя:', error);
        await createAdminUser();
      }
    };

    const updateUserFromTelegram = async (telegramUser: any, userId: string) => {
      try {
        await supabase
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

        // Обновляем localStorage
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
        console.log('✅ Данные обновлены в фоне');
      } catch (error) {
        console.error('❌ Ошибка фонового обновления:', error);
      }
    };

    const createAdminUser = async () => {
      try {
        console.log('👑 Создаем админа...');
        
        const { data: existingAdmin } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url, telegram_id, telegram_username')
          .eq('username', 'TrickMaster')
          .maybeSingle();

        let adminId = existingAdmin?.id;

        if (!existingAdmin) {
          const newAdminId = crypto.randomUUID();
          
          const { error: insertError } = await supabase
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
            });

          if (!insertError) {
            adminId = newAdminId;
            
            // Создаем user_points в фоне
            (async () => {
              try {
                await supabase.from('user_points').insert({
                  user_id: newAdminId,
                  total_points: 99999,
                  wins_count: 100,
                });
              } catch (err) {
                console.error('❌ Error creating admin points:', err);
              }
            })();
          }
        }

        const adminData = {
          id: adminId!,
          telegram_id: 'admin_web',
          username: 'TrickMaster',
          first_name: 'Admin',
          last_name: 'Master',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          telegram_username: 'TrickMaster',
        };

        console.log('✅ Админ готов:', adminData.username);
        setUser(adminData);
        localStorage.setItem('roller_tricks_user', JSON.stringify(adminData));

      } catch (error) {
        console.error('❌ Ошибка создания админа:', error);
        createFallbackUser();
      }
    };

    const createFallbackUser = () => {
      const fallbackUser = {
        id: crypto.randomUUID(),
        telegram_id: 'fallback_user',
        username: 'User',
        first_name: 'Guest',
        last_name: 'User',
        avatar_url: '',
        telegram_username: 'User',
      };
      console.log('🆘 Fallback пользователь создан');
      setUser(fallbackUser);
      localStorage.setItem('roller_tricks_user', JSON.stringify(fallbackUser));
    };

    // Запускаем инициализацию сразу
    initializeUser();
  }, []);

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
