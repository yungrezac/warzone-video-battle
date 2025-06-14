
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useVideoViews = () => {
  const queryClient = useQueryClient();

  const markVideoAsViewed = async (videoId: string) => {
    try {
      // Сначала получаем текущее количество просмотров
      const { data: currentVideo, error: fetchError } = await supabase
        .from('videos')
        .select('views')
        .eq('id', videoId)
        .single();

      if (fetchError) {
        console.error('Ошибка при получении видео:', fetchError);
        return;
      }

      // Увеличиваем счетчик просмотров на 1
      const { error } = await supabase
        .from('videos')
        .update({ views: (currentVideo.views || 0) + 1 })
        .eq('id', videoId);

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

export const useIncrementVideoViews = () => {
  const { markVideoAsViewed } = useVideoViews();
  
  return useMutation({
    mutationFn: markVideoAsViewed,
    onError: (error) => {
      console.error('Ошибка мутации просмотров:', error);
    },
  });
};
