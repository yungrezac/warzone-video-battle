
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

const TelegramAuth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTelegramAuth = async (telegramUser: TelegramUser) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `telegram_${telegramUser.id}@wzb.com`,
        password: `telegram_${telegramUser.id}_${telegramUser.hash}`,
      });

      if (error && error.message.includes('Invalid login credentials')) {
        // Пользователь не существует, создаем нового
        const { error: signUpError } = await supabase.auth.signUp({
          email: `telegram_${telegramUser.id}@wzb.com`,
          password: `telegram_${telegramUser.id}_${telegramUser.hash}`,
          options: {
            data: {
              username: telegramUser.username || `user_${telegramUser.id}`,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name,
              avatar_url: telegramUser.photo_url,
              telegram_id: telegramUser.id.toString(),
              telegram_username: telegramUser.username,
              telegram_photo_url: telegramUser.photo_url,
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }
      } else if (error) {
        throw error;
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Telegram auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Проверяем, если мы в Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();

      // Получаем данные пользователя из Telegram
      if (tg.initDataUnsafe?.user) {
        const telegramUser = tg.initDataUnsafe.user as TelegramUser;
        handleTelegramAuth(telegramUser);
      }
    }
  }, []);

  const handleManualAuth = () => {
    // Для тестирования создаем тестового пользователя
    const testUser: TelegramUser = {
      id: 123456789,
      first_name: 'ProGamer',
      last_name: '123',
      username: 'ProGamer123',
      photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      auth_date: Date.now(),
      hash: 'test_hash'
    };
    handleTelegramAuth(testUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Авторизация через Telegram...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WZ Battle</h1>
          <p className="text-gray-600">Войдите через Telegram, чтобы продолжить</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Button 
          onClick={handleManualAuth}
          className="w-full bg-blue-500 hover:bg-blue-600"
          disabled={loading}
        >
          Войти как тестовый пользователь
        </Button>

        <p className="text-xs text-gray-500 mt-4">
          В реальном приложении авторизация произойдет автоматически через Telegram WebApp
        </p>
      </div>
    </div>
  );
};

export default TelegramAuth;
