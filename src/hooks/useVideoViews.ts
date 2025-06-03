
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useIncrementVideoViews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      console.log('Увеличиваем просмотры для видео:', videoId);

      // Сначала получаем текущее количество просмотров
      const { data: currentVideo, error: fetchError } = await supabase
        .from('videos')
        .select('views')
        .eq('id', videoId)
        .single();

      if (fetchError) {
        console.error('Ошибка получения видео:', fetchError);
        throw fetchError;
      }

      // Увеличиваем счетчик на 1
      const newViews = (currentVideo.views || 0) + 1;

      const { error } = await supabase
        .from('videos')
        .update({ views: newViews })
        .eq('id', videoId);

      if (error) {
        console.error('Ошибка увеличения просмотров:', error);
        throw error;
      }

      console.log('Просмотры успешно увеличены до:', newViews);
    },
    onSuccess: () => {
      // Обновляем кэш после увеличения просмотров
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
    },
    onError: (error) => {
      console.error('Ошибка при увеличении просмотров:', error);
    },
  });
};
