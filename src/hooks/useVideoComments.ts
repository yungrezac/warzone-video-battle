import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useAchievementTriggers } from './useAchievementTriggers';
import { useTelegramNotifications } from './useTelegramNotifications';

export interface VideoComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  video_id: string;
  user?: {
    username?: string;
    telegram_username?: string;
    avatar_url?: string;
  };
}

export const useVideoComments = (videoId: string) => {
  return useQuery({
    queryKey: ['video-comments', videoId],
    queryFn: async () => {
      console.log('Загружаем комментарии для видео:', videoId);
      
      const { data: comments, error } = await supabase
        .from('video_comments')
        .select(`
          *,
          user:profiles!user_id(username, telegram_username, avatar_url)
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Ошибка загрузки комментариев:', error);
        throw error;
      }
      
      console.log('Комментарии загружены:', comments);
      return comments as VideoComment[];
    },
    enabled: !!videoId,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { triggerComment } = useAchievementTriggers();
  const { sendCommentNotification } = useTelegramNotifications();

  return useMutation({
    mutationFn: async ({ videoId, content }: { videoId: string; content: string }) => {
      if (!user?.id) {
        console.error('Пользователь не авторизован');
        throw new Error('User not authenticated');
      }

      console.log('Добавляем комментарий:', { videoId, content, userId: user.id });

      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content,
        })
        .select(`
          *,
          user:profiles!user_id(username, telegram_username, avatar_url)
        `)
        .single();

      if (error) {
        console.error('Ошибка добавления комментария:', error);
        throw error;
      }
      
      console.log('Комментарий добавлен:', data);

      // Trigger achievement for commenting
      triggerComment();

      // Отправляем уведомление владельцу видео
      try {
        const { data: video } = await supabase
          .from('videos')
          .select(`
            title,
            user_id,
            user:profiles!user_id(telegram_id, username, first_name)
          `)
          .eq('id', videoId)
          .single();

        if (video && video.user?.telegram_id && video.user_id !== user.id) {
          const commenterName = user.first_name || user.username || 'Роллер';
          await sendCommentNotification(video.user.telegram_id, commenterName, video.title, content);
        }
      } catch (notificationError) {
        console.error('Ошибка отправки уведомления о комментарии:', notificationError);
      }
      
      return data;
    },
    onSuccess: (data, { videoId }) => {
      console.log('Комментарий успешно добавлен, обновляем кэш');
      // Обновляем кэш комментариев для данного видео
      queryClient.invalidateQueries({ queryKey: ['video-comments', videoId] });
      // Также обновляем счетчик комментариев в списке видео
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      console.error('Ошибка добавления комментария:', error);
    },
  });
};
