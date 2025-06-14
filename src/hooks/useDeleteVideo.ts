
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export const useDeleteVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!user) {
        throw new Error('User not authenticated to delete video');
      }

      console.log('Attempting to delete video:', videoId, 'by user:', user.id);

      // 1. Получить информацию о видео, чтобы убедиться, что пользователь является владельцем
      const { data: videoData, error: fetchError } = await supabase
        .from('videos')
        .select('user_id, video_url, thumbnail_url')
        .eq('id', videoId)
        .single();

      if (fetchError) {
        console.error('Error fetching video for deletion:', fetchError);
        throw new Error(`Failed to fetch video details: ${fetchError.message}`);
      }

      if (!videoData) {
        throw new Error('Video not found.');
      }

      if (videoData.user_id !== user.id) {
        // Можно также добавить проверку на роль администратора, если это необходимо
        throw new Error('User is not authorized to delete this video.');
      }

      // 2. Удалить файлы из Storage
      const filesToDelete: string[] = [];
      if (videoData.video_url) {
        // Извлекаем путь к файлу из URL
        // Пример URL: https://<project-ref>.supabase.co/storage/v1/object/public/videos/user_id/filename.mp4
        // Путь будет: user_id/filename.mp4
        const videoPath = videoData.video_url.substring(videoData.video_url.indexOf('/videos/') + '/videos/'.length);
        filesToDelete.push(videoPath);
      }
      if (videoData.thumbnail_url) {
        const thumbPath = videoData.thumbnail_url.substring(videoData.thumbnail_url.indexOf('/videos/') + '/videos/'.length);
        filesToDelete.push(thumbPath);
      }

      if (filesToDelete.length > 0) {
        console.log('Deleting files from storage:', filesToDelete);
        const { error: storageError } = await supabase.storage
          .from('videos') // Убедитесь, что 'videos' - это ваш бакет
          .remove(filesToDelete);

        if (storageError) {
          // Не блокируем удаление из БД, если не удалось удалить файлы, но логируем
          console.warn('Failed to delete files from storage, proceeding with DB deletion:', storageError);
        }
      }
      
      // 3. Удалить запись из таблицы videos
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (deleteError) {
        console.error('Error deleting video from database:', deleteError);
        throw new Error(`Failed to delete video: ${deleteError.message}`);
      }

      console.log('Video deleted successfully from database:', videoId);
      return videoId;
    },
    onSuccess: (deletedVideoId) => {
      console.log('Invalidating queries after video deletion:', deletedVideoId);
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] }); 
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] }); // Для обновления статистики в профиле
      queryClient.invalidateQueries({ queryKey: ['yesterday-winner'] }); // Если удаленное видео было победителем

      // Убираем инвалидацию для video_ratings, так как таблица удалена
      // queryClient.invalidateQueries({ queryKey: ['video_ratings'] }); 
      // queryClient.invalidateQueries({ queryKey: ['video_ratings', deletedVideoId] });
    },
    onError: (error: Error) => {
      console.error('Mutation error on delete video:', error.message);
      // Можно добавить toast уведомление об ошибке здесь
    },
  });
};

