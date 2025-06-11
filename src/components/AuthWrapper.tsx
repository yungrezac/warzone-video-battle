
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        console.log('Инициализируем пользователя...');
        
        // Сначала проверяем сохраненного пользователя в localStorage для быстрой загрузки
        const savedUser = localStorage.getItem('roller_tricks_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          console.log('Быстрая загрузка сохраненного пользователя:', userData);
          setUser(userData);
          setLoading(false);
          return;
        }

        // Проверяем, запущено ли приложение в Telegram WebApp
        if (window.Telegram?.WebApp) {
          console.log('Telegram WebApp обнаружен');
          const tg = window.Telegram.WebApp;
          tg.ready();
          
          // Расширяем приложение на весь экран
          if (tg.expand) {
            tg.expand();
          }
          
          // Получаем данные пользователя из Telegram
          if (tg.initDataUnsafe?.user) {
            const telegramUser = tg.initDataUnsafe.user;
            console.log('Данные пользователя Telegram:', telegramUser);
            
            await createOrUpdateUser(telegramUser);
            return;
          }
        }

        // Если нет данных Telegram и нет сохраненного пользователя, показываем TelegramAuth
        console.log('Нет данных пользователя, переходим к экрану авторизации');

      } catch (err: any) {
        console.error('Ошибка инициализации пользователя:', err);
      } finally {
        setLoading(false);
      }
    };

    const createOrUpdateUser = async (telegramUser: any) => {
      try {
        const telegramId = telegramUser.id.toString();
        
        // Проверяем существует ли пользователь в базе
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('telegram_id', telegramId)
          .maybeSingle();

        let profileId = existingProfile?.id;

        if (!existingProfile) {
          // Пользователь не найден, создаем новый профиль
          const newUserId = crypto.randomUUID();
          
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

          if (insertProfileError) throw insertProfileError;

          // Создаем запись в user_points
          const { error: pointsError } = await supabase
            .from('user_points')
            .insert({
              user_id: newUserId,
              total_points: 0,
              wins_count: 0,
            });

          if (pointsError) {
            console.error('Ошибка создания points:', pointsError);
          }

          profileId = newUserId;
          console.log('Создан новый профиль пользователя:', newUserId);
        } else if (profileError) {
          throw profileError;
        } else {
          // Обновляем существующий профиль с актуальными данными из Telegram
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              username: telegramUser.username || existingProfile.username,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name,
              avatar_url: telegramUser.photo_url || existingProfile.avatar_url,
              telegram_username: telegramUser.username,
              telegram_photo_url: telegramUser.photo_url,
            })
            .eq('id', existingProfile.id);

          if (updateError) console.error('Ошибка обновления профиля:', updateError);
          console.log('Профиль пользователя обновлен');
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

        setUser(userData);
        localStorage.setItem('roller_tricks_user', JSON.stringify(userData));
        console.log('Пользователь установлен в контекст:', userData);

      } catch (err: any) {
        console.error('Ошибка создания/обновления пользователя:', err);
        throw err;
      }
    };

    initializeUser();
  }, []);

  const signIn = (userData: any) => {
    setUser(userData);
    localStorage.setItem('roller_tricks_user', JSON.stringify(userData));
  };

  const signOut = () => {
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
