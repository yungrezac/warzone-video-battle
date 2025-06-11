
import React, { useEffect } from 'react';
import { useAuth } from './AuthWrapper';

const TelegramAuth: React.FC = () => {
  const { signIn } = useAuth();

  useEffect(() => {
    const quickAuth = async () => {
      console.log('Быстрая авторизация...');
      
      // Сначала проверяем, есть ли сохраненный пользователь
      const savedUser = localStorage.getItem('roller_tricks_user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          console.log('Найден сохраненный пользователь:', userData);
          signIn(userData);
          return;
        } catch (error) {
          console.error('Ошибка парсинга сохраненного пользователя:', error);
          localStorage.removeItem('roller_tricks_user');
        }
      }

      // Проверяем Telegram WebApp
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        if (tg.expand) {
          tg.expand();
        }

        if (tg.initDataUnsafe?.user) {
          const telegramUser = tg.initDataUnsafe.user;
          console.log('Telegram пользователь найден:', telegramUser);
          
          const userData = {
            id: crypto.randomUUID(),
            telegram_id: telegramUser.id.toString(),
            username: telegramUser.username || `user_${telegramUser.id}`,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            avatar_url: telegramUser.photo_url,
            telegram_username: telegramUser.username,
          };

          signIn(userData);
          return;
        }
      }

      // Если ничего не найдено, создаем тестового пользователя
      console.log('Создаем тестового пользователя для быстрого входа');
      const testUser = {
        id: crypto.randomUUID(),
        telegram_id: Date.now().toString(),
        username: 'TestUser',
        first_name: 'Test',
        last_name: 'User',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
        telegram_username: 'TestUser',
      };

      signIn(testUser);
    };

    // Запускаем быструю авторизацию без задержки
    quickAuth();
  }, [signIn]);

  // Возвращаем минимальный интерфейс без лишних экранов загрузки
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Вход в систему...</p>
      </div>
    </div>
  );
};

export default TelegramAuth;
