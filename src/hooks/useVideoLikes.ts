
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useLikeVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      console.log('🎯 useLikeVideo: Обрабатываем лайк', { videoId, isLiked });

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Пользователь не авторизован');
      }

      if (isLiked) {
        // Убираем лайк
        console.log('📤 useLikeVideo: Убираем лайк');
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) {
          console.error('❌ useLikeVideo: Ошибка при удалении лайка:', error);
          throw error;
        }
      } else {
        // Ставим лайк
        console.log('💖 useLikeVideo: Ставим лайк');
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: user.id
          });

        if (error) {
          console.error('❌ useLikeVideo: Ошибка при постановке лайка:', error);
          throw error;
        }
      }

      console.log('✅ useLikeVideo: Лайк успешно обработан');
      return { videoId, isLiked: !isLiked };
    },
    onSuccess: (data) => {
      console.log('🔄 useLikeVideo: Обновляем кэш после успешного лайка');
      
      // Обновляем кэш видео
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      
      // Также обновляем кэш профиля пользователя
      queryClient.invalidateQueries({ queryKey: ['other-user-profile'] });
    },
    onError: (error) => {
      console.error('❌ useLikeVideo: Ошибка мутации лайка:', error);
      toast.error('Ошибка при обработке лайка');
    }
  });
};
