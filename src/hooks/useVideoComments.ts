
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useTelegramNotifications } from './useTelegramNotifications';

export const useVideoComments = (videoId: string) => {
  return useQuery({
    queryKey: ['video-comments', videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_comments')
        .select(`
          *,
          profiles:user_id (
            username,
            telegram_username,
            avatar_url
          )
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки комментариев:', error);
        throw error;
      }
      
      return data || [];
    },
    select: (data) => ({
      comments: data,
      isLoading: false
    })
  });
};

export const useAddVideoComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { sendCommentNotification } = useTelegramNotifications();

  return useMutation({
    mutationFn: async ({ videoId, content }: { videoId: string; content: string }) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      console.log('💬 Добавляем комментарий:', { videoId, content: content.substring(0, 50) + '...' });

      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content: content.trim(),
        })
        .select(`
          *,
          profiles:user_id (
            username,
            telegram_username,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Ошибка добавления комментария:', error);
        throw error;
      }

      console.log('✅ Комментарий добавлен:', data.id);

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
          const commenterName = user.username || user.telegram_username || 'Пользователь';
          
          if (ownerTelegramId) {
            await sendCommentNotification(
              videoData.user_id,
              ownerTelegramId,
              commenterName,
              videoData.title,
              content
            );
          }
        }
      } catch (error) {
        console.error('Ошибка отправки уведомления о комментарии:', error);
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Мутация комментария успешна, обновляем кэш...');
      // Инвалидируем кэши для обновления комментариев и баллов
      queryClient.invalidateQueries({ queryKey: ['video-comments', data.video_id] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      console.error('❌ Ошибка мутации комментария:', error);
    },
  });
};

export const useDeleteVideoComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, videoId }: { commentId: string; videoId: string }) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      console.log('🗑️ Удаляем комментарий:', commentId);

      const { error } = await supabase
        .from('video_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Ошибка удаления комментария:', error);
        throw error;
      }

      console.log('✅ Комментарий удален');
      return { commentId, videoId };
    },
    onSuccess: (data) => {
      console.log('✅ Мутация удаления комментария успешна, обновляем кэш...');
      // Инвалидируем кэши для обновления комментариев и баллов
      queryClient.invalidateQueries({ queryKey: ['video-comments', data.videoId] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      console.error('❌ Ошибка мутации удаления комментария:', error);
    },
  });
};

// Экспортируем useAddComment как алиас для совместимости
export const useAddComment = useAddVideoComment;
