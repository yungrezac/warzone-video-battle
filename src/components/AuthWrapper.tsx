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
    console.log('🔄 AuthWrapper useEffect запускается...');
    
    const initializeUser = async () => {
      try {
        console.log('⚡ Начинаем инициализацию пользователя...');
        
        // Проверяем сохраненного пользователя
        const savedUser = localStorage.getItem('roller_tricks_user');
        console.log('💾 Сохраненный пользователь:', savedUser ? 'найден' : 'не найден');
        
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            console.log('⚡ Быстрая загрузка пользователя:', userData.username || userData.first_name);
            setUser(userData);
            setLoading(false);
            return;
          } catch (parseError) {
            console.error('❌ Ошибка парсинга сохраненного пользователя:', parseError);
            localStorage.removeItem('roller_tricks_user');
          }
        }

        // Проверяем Telegram WebApp
        console.log('🔍 Проверяем среду выполнения...');
        console.log('📱 Window доступен:', typeof window !== 'undefined');
        
        if (typeof window !== 'undefined') {
          console.log('📱 Telegram объект:', !!window.Telegram);
          console.log('📱 WebApp объект:', !!window.Telegram?.WebApp);
          
          if (window.Telegram?.WebApp) {
            console.log('✅ Telegram WebApp обнаружен');
            const tg = window.Telegram.WebApp;
            
            console.log('🚀 Вызываем tg.ready()...');
            tg.ready();
            
            console.log('📊 initDataUnsafe:', JSON.stringify(tg.initDataUnsafe, null, 2));
            
            // Расширяем приложение
            if (tg.expand) {
              console.log('📱 Расширяем приложение...');
              tg.expand();
            }
            
            // Проверяем данные пользователя
            if (tg.initDataUnsafe?.user) {
              const telegramUser = tg.initDataUnsafe.user;
              console.log('👤 Данные пользователя Telegram:', {
                id: telegramUser.id,
                first_name: telegramUser.first_name,
                username: telegramUser.username
              });
              
              console.log('🔄 Создаем/обновляем пользователя...');
              await createOrUpdateUser(telegramUser);
              return;
            } else {
              console.log('❌ Нет данных пользователя в initDataUnsafe');
              console.log('🔍 Полный объект initDataUnsafe:', tg.initDataUnsafe);
            }
          } else {
            console.log('❌ Telegram WebApp не найден');
            console.log('🔍 Доступные свойства window.Telegram:', 
              window.Telegram ? Object.keys(window.Telegram) : 'Telegram объект отсутствует'
            );
          }
        } else {
          console.log('❌ Window объект недоступен');
        }

        console.log('🚫 Переходим к экрану авторизации');

      } catch (err: any) {
        console.error('❌ Критическая ошибка инициализации:', err);
        console.error('📋 Stack trace:', err.stack);
      } finally {
        console.log('✅ Завершаем инициализацию, убираем loading');
        setLoading(false);
      }
    };

    const createOrUpdateUser = async (telegramUser: any) => {
      try {
        const telegramId = telegramUser.id.toString();
        console.log('🔍 Ищем пользователя с Telegram ID:', telegramId);
        
        // Проверяем существует ли пользователь в базе
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('telegram_id', telegramId)
          .maybeSingle();

        console.log('🔍 Результат поиска:', { найден: !!existingProfile, ошибка: !!profileError });

        let profileId = existingProfile?.id;

        if (!existingProfile) {
          // Пользователь не найден, создаем новый профиль
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

          if (insertProfileError) throw insertProfileError;

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
          throw profileError;
        } else {
          // Обновляем существующий профиль с актуальными данными из Telegram
          console.log('🔄 Обновляем существующий профиль:', existingProfile.id);
          
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

          if (updateError) console.error('❌ Ошибка обновления профиля:', updateError);
          console.log('✅ Профиль пользователя обновлен');
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
        throw err;
      }
    };

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
