
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useTelegramNotifications } from './useTelegramNotifications';

export const useLikeVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { sendLikeNotification } = useTelegramNotifications();

  return useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      console.log('🔄 Обрабатываем лайк:', { videoId, isLiked, userId: user.id });

      if (isLiked) {
        // Убираем лайк
        console.log('❌ Убираем лайк...');
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Ошибка при удалении лайка:', error);
          throw error;
        }

        console.log('✅ Лайк убран');
      } else {
        // Ставим лайк
        console.log('❤️ Ставим лайк...');
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: user.id,
          });

        if (error) {
          console.error('Ошибка при добавлении лайка:', error);
          throw error;
        }

        console.log('✅ Лайк поставлен');

        // Отправляем уведомление владельцу видео
        try {
          const { data: videoData } = await supabase
            .from('videos')
            .select(`
              title,
              user_id,
              profiles!inner(telegram_id, username, telegram_username)
            `)
            .eq('id', videoId)
            .single();

          if (videoData && videoData.profiles && videoData.user_id !== user.id) {
            const ownerTelegramId = videoData.profiles.telegram_id;
            const likerName = user.username || user.telegram_username || 'Пользователь';
            
            if (ownerTelegramId) {
              await sendLikeNotification(
                videoData.user_id,
                ownerTelegramId,
                likerName,
                videoData.title
              );
            }
          }
        } catch (error) {
          console.error('Ошибка отправки уведомления о лайке:', error);
        }
      }

      const newIsLiked = !isLiked;
      console.log('🏁 Завершили обработку лайка. Новое состояние:', newIsLiked);
      return { videoId, isLiked: newIsLiked };
    },
    onSuccess: (data) => {
      console.log('✅ Мутация лайка успешна, обновляем кэш запросов...');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      console.error('❌ Ошибка при обработке лайка:', error);
    },
  });
};
