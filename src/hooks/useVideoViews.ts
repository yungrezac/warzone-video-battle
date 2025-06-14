
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useVideoViews = () => {
  const queryClient = useQueryClient();

  const markVideoAsViewed = async (videoId: string) => {
    try {
      // Увеличиваем счетчик просмотров
      const { error } = await supabase.rpc('increment_video_views', {
        video_id: videoId
      });

      if (error) {
        console.error('Ошибка при увеличении просмотров:', error);
        return;
      }

      // Инвалидируем кэши для обновления статистики и баллов
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      
      console.log('Просмотр засчитан для видео:', videoId);
    } catch (error) {
      console.error('Ошибка при обработке просмотра:', error);
    }
  };

  return { markVideoAsViewed };
};
