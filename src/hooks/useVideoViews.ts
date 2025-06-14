
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useVideoViews = () => {
  const queryClient = useQueryClient();

  const markVideoAsViewed = async (videoId: string) => {
    try {
      console.log('🎬 Увеличиваем счетчик просмотров для видео:', videoId);
      
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
      const newViewsCount = (currentVideo.views || 0) + 1;
      console.log('📊 Обновляем счетчик просмотров с', currentVideo.views, 'до', newViewsCount);
      
      const { error } = await supabase
        .from('videos')
        .update({ views: newViewsCount })
        .eq('id', videoId);

      if (error) {
        console.error('Ошибка при увеличении просмотров:', error);
        return;
      }

      console.log('✅ Просмотр засчитан для видео:', videoId);
      
      // Инвалидируем кэши для обновления статистики и баллов
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      
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
