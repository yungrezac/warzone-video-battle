
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Crown, CheckCircle } from 'lucide-react';
import { useAuth } from './AuthWrapper';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

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
  const { webApp, user, isReady, isTelegramWebApp } = useTelegramWebApp();

  useEffect(() => {
    console.log('🔐 TelegramAuth компонент загружен');
    
    // Автоматическая авторизация если есть пользователь из Telegram
    if (isReady && user && isTelegramWebApp) {
      console.log('🎯 Автоматическая авторизация пользователя:', user.first_name);
      handleTelegramAuth(user as TelegramUser);
    } else if (isReady && !isTelegramWebApp) {
      // Автоматический вход как админ если не в Telegram
      console.log('🔧 Вход вне Telegram - используем админский аккаунт');
      setTimeout(() => {
        handleAdminAuth();
      }, 1000);
    }
  }, [isReady, user, isTelegramWebApp]);

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

  const handleAdminAuth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('👑 Создаем админский аккаунт для входа вне Telegram');
      
      // Проверяем существует ли админ профиль
      const { data: existingAdmin, error: adminError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', 'TrickMaster')
        .maybeSingle();

      let adminId = existingAdmin?.id;

      if (!existingAdmin && (!adminError || adminError.code === 'PGRST116')) {
        // Создаем админский профиль
        const newAdminId = crypto.randomUUID();
        
        console.log('➕ Создаем админский профиль с ID:', newAdminId);
        
        const { data: newAdmin, error: insertAdminError } = await supabase
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
            is_premium: true,
          })
          .select()
          .single();

        if (insertAdminError) {
          console.error('❌ Ошибка создания админского профиля:', insertAdminError);
          throw insertAdminError;
        }

        console.log('✅ Админский профиль создан:', newAdmin);

        // Создаем запись в user_points
        const { error: pointsError } = await supabase
          .from('user_points')
          .insert({
            user_id: newAdminId,
            total_points: 99999,
            wins_count: 100,
          });

        if (pointsError) {
          console.error('❌ Ошибка создания points для админа:', pointsError);
        }

        adminId = newAdminId;
      } else if (adminError) {
        console.error('❌ Ошибка при поиске админского профиля:', adminError);
        throw adminError;
      } else {
        adminId = existingAdmin.id;
      }

      // Устанавливаем админа в контекст
      const adminData = {
        id: adminId,
        telegram_id: 'admin_web',
        username: 'TrickMaster',
        first_name: 'Admin',
        last_name: 'Master',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        telegram_username: 'TrickMaster',
      };

      console.log('✅ Устанавливаем админа:', adminData);
      
      signIn(adminData);

    } catch (err: any) {
      console.error('❌ Admin auth error:', err);
      setError(err.message || 'Произошла ошибка при авторизации админа');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TRICKS</h1>
          <p className="text-gray-600">Добро пожаловать в мир трюков!</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-800 mb-2">Статус подключения:</h4>
            <div className="text-blue-700 space-y-1">
              <div className="flex items-center justify-between">
                <span>Telegram WebApp:</span>
                {isTelegramWebApp ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <span className="text-orange-500">Браузер</span>
                )}
              </div>
              {user && (
                <div className="flex items-center justify-between">
                  <span>Пользователь:</span>
                  <span className="text-green-600">{user.first_name}</span>
                </div>
              )}
            </div>
          </div>

          {!isTelegramWebApp && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-800">Демо режим</h4>
              </div>
              <p className="text-yellow-700 text-sm mb-3">
                Вы используете демо-версию. Для полной функциональности откройте приложение через Telegram.
              </p>
              <Button 
                onClick={handleAdminAuth}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                disabled={loading}
              >
                <Crown className="w-4 h-4 mr-2" />
                Продолжить как демо-пользователь
              </Button>
            </div>
          )}

          <p className="text-xs text-gray-500">
            {isTelegramWebApp 
              ? 'Авторизация через Telegram прошла успешно'
              : 'Для полной функциональности используйте Telegram Mini App'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default TelegramAuth;
