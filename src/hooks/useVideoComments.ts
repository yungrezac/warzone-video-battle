
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useTelegramNotifications } from './useTelegramNotifications';

interface VideoComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  video_id: string;
  user_id: string;
  profiles?: {
    username?: string;
    telegram_username?: string;
    avatar_url?: string;
  };
}

export const useVideoComments = (videoId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { sendCommentNotification } = useTelegramNotifications();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['video-comments', videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_comments')
        .select(`
          *,
          profiles (
            username,
            telegram_username,
            avatar_url
          )
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as VideoComment[];
    },
    enabled: !!videoId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-comments', videoId] });
    },
  });

  return {
    comments,
    isLoading,
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
  };
};
