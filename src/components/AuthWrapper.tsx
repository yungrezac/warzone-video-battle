
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as AuthUser } from '@supabase/supabase-js';

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

  useEffect(() => {
    console.log('🚀 AuthWrapper инициализация...');
    
    const initializeUser = async () => {
      try {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
          const telegramUser = window.Telegram.WebApp.initDataUnsafe.user;
          console.log('⚡ Загрузка из Telegram:', telegramUser.first_name);
          await createOrLoginTelegramUser(telegramUser);
        } else {
          console.log('🌐 Веб-версия - создаем или входим как админ');
          await createOrLoginAdminUser();
        }
      } catch (err: any) {
        console.error('❌ Ошибка инициализации:', err);
        createFallbackUser();
      } finally {
        setLoading(false);
      }
    };

    const createOrLoginTelegramUser = async (telegramUser: any) => {
      const telegramId = telegramUser.id.toString();
      const email = `${telegramId}@telegram.user`;
      const password = `tg_user_secret_pwd_!${telegramId}`;

      let { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError && signInError.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: telegramUser.username || `user_${telegramId.slice(-5)}`,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name,
              avatar_url: telegramUser.photo_url,
              telegram_id: telegramId,
              telegram_username: telegramUser.username,
              telegram_photo_url: telegramUser.photo_url,
            }
          }
        });
        if (signUpError) throw signUpError;
        authData = signUpData;
      } else if (signInError) {
        throw signInError;
      }
      
      const authUser = authData.user;
      if (!authUser) throw new Error("Не удалось аутентифицировать пользователя Telegram");

      await fetchAndSetProfile(authUser, telegramId);
    };

    const createOrLoginAdminUser = async () => {
      const email = 'admin@trickmaster.app';
      const password = 'admin_password_trickmaster_web';

      let { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError && signInError.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: 'TrickMaster',
              first_name: 'Admin',
              last_name: 'Master',
              avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
              telegram_id: 'admin_web',
              telegram_username: 'TrickMaster',
              telegram_photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            }
          }
        });
        if (signUpError) throw signUpError;
        authData = signUpData;
      } else if (signInError) {
        throw signInError;
      }
      
      const authUser = authData.user;
      if (!authUser) throw new Error("Не удалось аутентифицировать админа");
      
      await fetchAndSetProfile(authUser, 'admin_web');
    };

    const fetchAndSetProfile = async (authUser: AuthUser, telegramId: string) => {
      // Профиль должен создаваться триггером. Попробуем его получить.
      // Иногда бывает задержка, поэтому добавим небольшие повторные попытки.
      let profile = null;
      for (let i = 0; i < 3; i++) {
        const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        if (data) {
          profile = data;
          break;
        }
        await new Promise(res => setTimeout(res, 300));
      }

      if (!profile) {
          console.warn("Профиль не найден, возможно задержка. Используем данные из метаданных.");
          profile = authUser.user_metadata;
      }

      const userData = {
        id: authUser.id,
        telegram_id: telegramId,
        username: profile.username,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        telegram_username: profile.telegram_username,
      };

      console.log('✅ Пользователь аутентифицирован:', userData.username || userData.first_name);
      setUser(userData);
    }

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
  }, []);

  const signIn = (userData: any) => {
    console.log('🔐 Вход пользователя:', userData.username || userData.first_name);
    setUser(userData);
  };

  const signOut = async () => {
    console.log('🚪 Выход пользователя');
    await supabase.auth.signOut();
    setUser(null);
  };

  const contextValue = { user, loading, signOut, signIn };

  return (
    <AuthContext.Provider value={contextValue}>
      {typeof children === 'function' ? children({ user, loading }) : children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;
