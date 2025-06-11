
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
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Уменьшаем счетчик
        await supabase.rpc('decrement_likes_count', { video_id: videoId });
      } else {
        // Ставим лайк
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: user.id,
          });

        if (error) throw error;

        // Увеличиваем счетчик
        await supabase.rpc('increment_likes_count', { video_id: videoId });

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

      return { videoId, isLiked: !isLiked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
    },
    onError: (error) => {
      console.error('Ошибка при обработке лайка:', error);
    },
  });
};
