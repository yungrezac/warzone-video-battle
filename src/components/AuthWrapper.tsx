import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import FullScreenLoader from './FullScreenLoader';

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
  signOut: () => void;
  signIn: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
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
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: telegramUser, isTelegramWebApp, isReady } = useTelegramWebApp();

  useEffect(() => {
    console.log('🚀 Оптимизированная AuthWrapper инициализация...');
    
    const initializeUser = async () => {
      if (!isReady) return;

      try {
        setIsLoading(true);

        if (isTelegramWebApp && telegramUser) {
          console.log('⚡ Быстрая инициализация Telegram пользователя:', telegramUser.first_name);
          await createOrLoginTelegramUser(telegramUser);
        } else {
          console.log('🌐 Быстрая инициализация веб-админа');
          await createAdminUser();
        }
      } catch (err: any) {
        console.error('❌ Ошибка инициализации:', err);
        createFallbackUser();
      } finally {
        setIsLoading(false);
      }
    };

    const createOrLoginTelegramUser = async (telegramUser: any) => {
      const telegramId = telegramUser.id.toString();
      console.log('👤 Быстрая обработка Telegram пользователя:', telegramId);
      
      try {
        // Более быстрый запрос - только нужные поля
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url, telegram_id')
          .eq('telegram_id', telegramId)
          .maybeSingle();

        let profileId = existingProfile?.id;

        if (!existingProfile) {
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
            
            // Асинхронно создаем points в фоне для ускорения
            setTimeout(async () => {
              try {
                await supabase.from('user_points').insert({
                  user_id: newUserId,
                  total_points: 0,
                  wins_count: 0,
                });
              } catch (err) {
                console.warn('⚠️ Ошибка создания points (не критично):', err);
              }
            }, 0);
          }
        }

        const userData = {
          id: profileId!,
          telegram_id: telegramId,
          username: telegramUser.username || `user_${telegramUser.id}`,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          avatar_url: telegramUser.photo_url,
          telegram_username: telegramUser.username,
        };

        console.log('✅ Telegram пользователь быстро готов:', userData.username || userData.first_name);
        setUser(userData);

      } catch (error) {
        console.error('❌ Ошибка создания Telegram пользователя:', error);
        await createAdminUser();
      }
    };

    const createAdminUser = async () => {
      try {
        console.log('👑 Создаем админа для веб-версии...');
        
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
            
            setTimeout(async () => {
              try {
                await supabase.from('user_points').insert({
                  user_id: newAdminId,
                  total_points: 99999,
                  wins_count: 100,
                });
              } catch (err) {
                console.error('❌ Error creating admin points:', err);
              }
            }, 0);
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
    };

    initializeUser();
  }, [isReady, isTelegramWebApp, telegramUser]);

  const signIn = (userData: any) => {
    console.log('🔐 Вход пользователя:', userData.username || userData.first_name);
    setUser(userData);
  };

  const signOut = () => {
    console.log('🚪 Выход пользователя');
    setUser(null);
  };

  const contextValue = { user, signOut, signIn };

  if (isLoading || !isReady) {
    return <FullScreenLoader />;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;
