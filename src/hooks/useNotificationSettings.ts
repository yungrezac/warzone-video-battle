
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export interface NotificationSettings {
  id: string;
  user_id: string;
  likes_notifications: boolean;
  comments_notifications: boolean;
  winners_notifications: boolean;
  system_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotificationSettings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('Загружаем настройки уведомлений для пользователя:', user.id);

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Ошибка загрузки настроек уведомлений:', error);
        throw error;
      }

      // Если настроек нет, создаем их с дефолтными значениями
      if (!data) {
        console.log('Создаем дефолтные настройки уведомлений');
        const { data: newSettings, error: createError } = await supabase
          .from('notification_settings')
          .insert({
            user_id: user.id,
            likes_notifications: true,
            comments_notifications: true,
            winners_notifications: true,
            system_notifications: true,
          })
          .select()
          .single();

        if (createError) {
          console.error('Ошибка создания настроек уведомлений:', createError);
          throw createError;
        }

        return newSettings as NotificationSettings;
      }

      return data as NotificationSettings;
    },
    enabled: !!user?.id,
  });
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('Обновляем настройки уведомлений:', settings);

      const { data, error } = await supabase
        .from('notification_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Ошибка обновления настроек уведомлений:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      console.log('Настройки уведомлений обновлены успешно');
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });
};
