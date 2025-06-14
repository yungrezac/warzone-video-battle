
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useVideoViews = () => {
  const queryClient = useQueryClient();

  const markVideoAsViewed = async (videoId: string) => {
    try {
      // Увеличиваем счетчик просмотров напрямую через UPDATE
      const { error } = await supabase
        .from('videos')
        .update({ views: supabase.sql`views + 1` })
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
