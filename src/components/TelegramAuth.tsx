import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from './AuthWrapper';

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
  const { signIn } = useAuth();

  useEffect(() => {
    console.log('🔐 TelegramAuth компонент загружен');
    console.log('🌐 Проверяем Telegram в TelegramAuth...');
    
    if (typeof window !== 'undefined') {
      console.log('📱 Window доступен в TelegramAuth');
      console.log('📱 Telegram объект:', !!window.Telegram);
      console.log('📱 WebApp объект:', !!window.Telegram?.WebApp);
      
      if (window.Telegram?.WebApp) {
        console.log('✅ Telegram WebApp доступен в TelegramAuth');
        const tg = window.Telegram.WebApp;
        console.log('📊 initDataUnsafe в TelegramAuth:', JSON.stringify(tg.initDataUnsafe, null, 2));
        console.log('👤 Пользователь в initDataUnsafe:', tg.initDataUnsafe?.user);
        
        // Пытаемся повторно вызвать ready
        console.log('🔄 Повторно вызываем tg.ready()...');
        tg.ready();
        
        // Проверяем через небольшую задержку
        setTimeout(() => {
          console.log('⏰ Повторная проверка через 1 секунду:', {
            initDataUnsafe: tg.initDataUnsafe,
            user: tg.initDataUnsafe?.user
          });
        }, 1000);
      } else {
        console.log('❌ Telegram WebApp НЕ доступен в TelegramAuth');
      }
    } else {
      console.log('❌ Window НЕ доступен в TelegramAuth');
    }
  }, []);

  const handleTelegramAuth = async (telegramUser: TelegramUser) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Обрабатываем пользователя:', telegramUser.first_name);
      
      // Проверяем существует ли пользователь в profiles
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', telegramUser.id.toString())
        .maybeSingle();

      let profileId = existingProfile?.id;

      if (!existingProfile && (!profileError || profileError.code === 'PGRST116')) {
        // Пользователь не найден, создаем новый профиль
        const newUserId = crypto.randomUUID();
        
        console.log('➕ Создаем новый профиль с ID:', newUserId);
        
        const { data: newProfile, error: insertProfileError } = await supabase
          .from('profiles')
          .insert({
            id: newUserId,
            username: telegramUser.username || `user_${telegramUser.id}`,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            avatar_url: telegramUser.photo_url,
            telegram_id: telegramUser.id.toString(),
            telegram_username: telegramUser.username,
            telegram_photo_url: telegramUser.photo_url,
          })
          .select()
          .single();

        if (insertProfileError) {
          console.error('❌ Ошибка создания профиля:', insertProfileError);
          throw insertProfileError;
        }

        console.log('✅ Профиль создан:', newProfile);

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
        console.error('❌ Ошибка при поиске профиля:', profileError);
        throw profileError;
      } else if (existingProfile) {
        // Обновляем существующий профиль актуальными данными
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

        if (updateError) {
          console.error('❌ Ошибка обновления профиля:', updateError);
        }
        
        profileId = existingProfile.id;
      }

      // Устанавливаем пользователя в контекст
      const userData = {
        id: profileId,
        telegram_id: telegramUser.id.toString(),
        username: telegramUser.username || `user_${telegramUser.id}`,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        avatar_url: telegramUser.photo_url,
        telegram_username: telegramUser.username,
      };

      console.log('✅ Устанавливаем пользователя:', userData);
      
      signIn(userData);

    } catch (err: any) {
      console.error('❌ Telegram auth error:', err);
      setError(err.message || 'Произошла ошибка при авторизации');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAuth = () => {
    console.log('🔧 Используем тестовую авторизацию');
    // Для тестирования создаем тестового пользователя
    const testUser: TelegramUser = {
      id: Math.floor(Math.random() * 1000000),
      first_name: 'TestUser',
      last_name: 'TG',
      username: 'testuser_tg',
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
          <p className="text-gray-600">Авторизация...</p>
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

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-800 mb-2">Информация о загрузке:</h4>
            <div className="text-blue-700 space-y-1">
              <p>• Window: {typeof window !== 'undefined' ? '✅' : '❌'}</p>
              <p>• Telegram: {typeof window !== 'undefined' && window.Telegram ? '✅' : '❌'}</p>
              <p>• WebApp: {typeof window !== 'undefined' && window.Telegram?.WebApp ? '✅' : '❌'}</p>
              {typeof window !== 'undefined' && window.Telegram?.WebApp && (
                <p>• Пользователь: {window.Telegram.WebApp.initDataUnsafe?.user ? '✅' : '❌'}</p>
              )}
            </div>
          </div>

          <Button 
            onClick={handleManualAuth}
            className="w-full bg-blue-500 hover:bg-blue-600"
            disabled={loading}
          >
            Войти как тестовый пользователь
          </Button>

          <p className="text-xs text-gray-500">
            В реальном Telegram WebApp авторизация произойдет автоматически
          </p>
        </div>
      </div>
    </div>
  );
};

export default TelegramAuth;
