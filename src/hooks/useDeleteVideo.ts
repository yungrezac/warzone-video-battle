import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export const useDeleteVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Удаляем видео:', videoId);

      // Сначала получаем информацию о видео для удаления файла из storage
      const { data: video, error: fetchError } = await supabase
        .from('videos')
        .select('video_url, user_id')
        .eq('id', videoId)
        .single();

      if (fetchError) {
        console.error('Ошибка получения видео:', fetchError);
        throw fetchError;
      }

      // Проверяем, что пользователь может удалить это видео
      if (video.user_id !== user.id) {
        throw new Error('У вас нет прав на удаление этого видео');
      }

      // Удаляем связанные записи (лайки, комментарии, рейтинги)
      const { error: likesError } = await supabase
        .from('video_likes')
        .delete()
        .eq('video_id', videoId);

      if (likesError) {
        console.error('Ошибка удаления лайков:', likesError);
      }

      const { error: commentsError } = await supabase
        .from('video_comments')
        .delete()
        .eq('video_id', videoId);

      if (commentsError) {
        console.error('Ошибка удаления комментариев:', commentsError);
      }

      const { error: ratingsError } = await supabase
        .from('video_ratings' as any)
        .delete()
        .eq('video_id', videoId);

      if (ratingsError) {
        console.error('Ошибка удаления рейтингов:', ratingsError);
      }

      // Удаляем видео из базы данных
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (deleteError) {
        console.error('Ошибка удаления видео из БД:', deleteError);
        throw deleteError;
      }

      // Удаляем файл из storage
      if (video.video_url) {
        const fileName = video.video_url.split('/').pop();
        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from('videos')
            .remove([`${user.id}/${fileName}`]);

          if (storageError) {
            console.error('Ошибка удаления файла из storage:', storageError);
            // Не бросаем ошибку, так как файл может уже не существовать
          }
        }
      }

      console.log('Видео успешно удалено');
    },
    onSuccess: () => {
      // Обновляем кэш
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      console.error('Ошибка удаления видео:', error);
    },
  });
};
