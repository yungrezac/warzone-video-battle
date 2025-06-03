
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setCurrentUser } from '@/hooks/useVideos';

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
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Проверяем есть ли пользователь в localStorage
        const savedUser = localStorage.getItem('wzb_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setCurrentUser({ id: userData.id, telegram_id: userData.telegram_id });
          setLoading(false);
          return;
        }

        // Если пользователя нет, создаем тестового пользователя
        const testTelegramId = '123456789';
        
        // Проверяем существует ли пользователь в базе
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('telegram_id', testTelegramId)
          .single();

        let profileId = existingProfile?.id;

        if (profileError && profileError.code === 'PGRST116') {
          // Пользователь не найден, создаем новый профиль
          const newUserId = crypto.randomUUID();
          
          const { error: insertProfileError } = await supabase
            .from('profiles')
            .insert({
              id: newUserId,
              username: 'ProGamer123',
              first_name: 'ProGamer',
              last_name: '123',
              avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
              telegram_id: testTelegramId,
              telegram_username: 'ProGamer123',
              telegram_photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
            });

          if (insertProfileError) throw insertProfileError;

          // Создаем запись в user_points
          const { error: pointsError } = await supabase
            .from('user_points')
            .insert({
              user_id: newUserId,
              total_points: 0,
              wins_count: 0,
            });

          if (pointsError) throw pointsError;

          profileId = newUserId;
        } else if (profileError) {
          throw profileError;
        }

        // Устанавливаем пользователя в контекст
        const userData = {
          id: profileId,
          telegram_id: testTelegramId,
          username: 'ProGamer123',
          first_name: 'ProGamer',
          last_name: '123',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
          telegram_username: 'ProGamer123',
        };

        setCurrentUser({ id: profileId, telegram_id: testTelegramId });
        setUser(userData);
        localStorage.setItem('wzb_user', JSON.stringify(userData));

      } catch (err: any) {
        console.error('Error initializing user:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  const signIn = (userData: any) => {
    setUser(userData);
    localStorage.setItem('wzb_user', JSON.stringify(userData));
    setCurrentUser({ id: userData.id, telegram_id: userData.telegram_id });
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('wzb_user');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;
