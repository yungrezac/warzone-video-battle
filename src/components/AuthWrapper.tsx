
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
    console.log('AuthWrapper: Инициализация...');
    
    // Быстрая проверка сохраненного пользователя
    const savedUser = localStorage.getItem('roller_tricks_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('AuthWrapper: Загружен сохраненный пользователь:', userData);
        setUser(userData);
        setLoading(false);
        
        // Асинхронно создаем/обновляем пользователя в базе
        createOrUpdateUserInBackground(userData);
        return;
      } catch (error) {
        console.error('AuthWrapper: Ошибка парсинга пользователя:', error);
        localStorage.removeItem('roller_tricks_user');
      }
    }

    setLoading(false);
  }, []);

  const createOrUpdateUserInBackground = async (userData: User) => {
    try {
      console.log('Фоновое создание/обновление пользователя:', userData);
      
      // Проверяем существует ли пользователь в базе
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', userData.telegram_id)
        .maybeSingle();

      if (!existingProfile) {
        // Создаем новый профиль
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userData.id,
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name,
            avatar_url: userData.avatar_url,
            telegram_id: userData.telegram_id,
            telegram_username: userData.telegram_username,
          });

        if (insertError) {
          console.error('Ошибка создания профиля:', insertError);
        }

        // Создаем запись в user_points
        const { error: pointsError } = await supabase
          .from('user_points')
          .insert({
            user_id: userData.id,
            total_points: 0,
            wins_count: 0,
          });

        if (pointsError) {
          console.error('Ошибка создания points:', pointsError);
        }

        console.log('Новый пользователь создан в фоне');
      } else {
        console.log('Пользователь уже существует в базе');
      }
    } catch (error) {
      console.error('Ошибка фонового создания пользователя:', error);
    }
  };

  const signIn = async (userData: any) => {
    console.log('AuthWrapper: Вход пользователя:', userData);
    
    const user = {
      id: userData.id,
      telegram_id: userData.telegram_id,
      username: userData.username,
      first_name: userData.first_name,
      last_name: userData.last_name,
      avatar_url: userData.avatar_url,
      telegram_username: userData.telegram_username,
    };

    setUser(user);
    localStorage.setItem('roller_tricks_user', JSON.stringify(user));
    
    // Фоновое создание/обновление в базе
    createOrUpdateUserInBackground(user);
  };

  const signOut = () => {
    console.log('AuthWrapper: Выход пользователя');
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
