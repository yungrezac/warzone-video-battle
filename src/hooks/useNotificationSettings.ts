
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';

export interface NotificationSettings {
  likes_notifications: boolean;
  comments_notifications: boolean;
  winners_notifications: boolean;
  achievements_notifications: boolean;
  system_notifications: boolean;
}

export const useNotificationSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    likes_notifications: true,
    comments_notifications: true,
    winners_notifications: true,
    achievements_notifications: true,
    system_notifications: true,
  });
  const [loading, setLoading] = useState(false);

  // Загружаем настройки при инициализации
  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      console.log('Загружаем настройки уведомлений для пользователя:', user.id);
      
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Ошибка загрузки настроек:', error);
        if (error.code !== 'PGRST116') {
          toast.error('Ошибка загрузки настроек');
        }
        return;
      }

      if (data) {
        console.log('Настройки загружены:', data);
        setSettings({
          likes_notifications: data.likes_notifications,
          comments_notifications: data.comments_notifications,
          winners_notifications: data.winners_notifications,
          achievements_notifications: data.achievements_notifications,
          system_notifications: data.system_notifications,
        });
      } else {
        console.log('Настройки не найдены, используем значения по умолчанию');
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек уведомлений:', error);
      toast.error('Ошибка загрузки настроек');
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user?.id) {
      toast.error('Необходима авторизация');
      return;
    }

    setLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      console.log('Сохраняем настройки:', {
        user_id: user.id,
        settings: updatedSettings
      });

      // Сначала пробуем обновить существующую запись
      const { data: existingData, error: selectError } = await supabase
        .from('notification_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Ошибка поиска существующих настроек:', selectError);
        throw selectError;
      }

      let saveError = null;

      if (existingData?.id) {
        // Обновляем существующую запись
        console.log('Обновляем существующие настройки с ID:', existingData.id);
        const { error } = await supabase
          .from('notification_settings')
          .update(updatedSettings)
          .eq('user_id', user.id);
        
        saveError = error;
      } else {
        // Создаем новую запись
        console.log('Создаем новые настройки');
        const { error } = await supabase
          .from('notification_settings')
          .insert({
            user_id: user.id,
            ...updatedSettings,
          });
        
        saveError = error;
      }

      if (saveError) {
        console.error('Ошибка сохранения настроек:', saveError);
        toast.error(`Ошибка сохранения: ${saveError.message}`);
        return;
      }

      setSettings(updatedSettings);
      toast.success('Настройки сохранены');
      console.log('Настройки успешно сохранены');
    } catch (error: any) {
      console.error('Ошибка обновления настроек:', error);
      toast.error(`Ошибка сохранения настроек: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    updateSettings,
    loading,
  };
};
