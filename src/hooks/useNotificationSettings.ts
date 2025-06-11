
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
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Ошибка загрузки настроек:', error);
        return;
      }

      if (data) {
        setSettings({
          likes_notifications: data.likes_notifications,
          comments_notifications: data.comments_notifications,
          winners_notifications: data.winners_notifications,
          achievements_notifications: data.achievements_notifications,
          system_notifications: data.system_notifications,
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек уведомлений:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          ...updatedSettings,
        });

      if (error) {
        console.error('Ошибка сохранения настроек:', error);
        toast.error('Ошибка сохранения настроек');
        return;
      }

      setSettings(updatedSettings);
      toast.success('Настройки сохранены');
    } catch (error) {
      console.error('Ошибка обновления настроек:', error);
      toast.error('Ошибка сохранения настроек');
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
