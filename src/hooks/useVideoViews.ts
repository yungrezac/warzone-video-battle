
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useIncrementVideoViews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      console.log('Увеличиваем просмотры для видео:', videoId);

      const { error } = await supabase
        .from('videos')
        .update({ 
          views: supabase.sql`views + 1` 
        })
        .eq('id', videoId);

      if (error) {
        console.error('Ошибка увеличения просмотров:', error);
        throw error;
      }

      console.log('Просмотры успешно увеличены');
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
