import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useTelegramNotifications } from './useTelegramNotifications';
import { toast } from 'sonner';

export interface Comment {
  id: string;
  created_at: string;
  content: string;
  likes_count: number;
  user_id: string;
  video_id: string;
  parent_comment_id: string | null;
  profiles: {
    username: string | null;
    telegram_username: string | null;
    avatar_url: string | null;
  } | null;
  user_liked: boolean;
  replies: Comment[];
  parent_comment_author?: {
    username: string | null;
    telegram_username: string | null;
  } | null;
}

export const useVideoComments = (videoId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['video-comments', videoId],
    queryFn: async () => {
      const { data: comments, error } = await supabase
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
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Ошибка загрузки комментариев:', error);
        throw error;
      }
      if (!comments) return [];
      
      let userLikedCommentIds: string[] = [];
      if (user?.id) {
          const { data: likes } = await supabase
              .from('video_comment_likes')
              .select('comment_id')
              .eq('user_id', user.id)
              .in('comment_id', comments.map(c => c.id));
          
          if (likes) {
              userLikedCommentIds = likes.map(l => l.comment_id);
          }
      }

      const commentsWithDetails: (Omit<Comment, 'replies' | 'user_liked' | 'parent_comment_author'> & { user_liked: boolean, replies: Comment[], parent_comment_author?: any })[] = comments.map(comment => ({
        ...comment,
        user_liked: userLikedCommentIds.includes(comment.id),
        replies: [],
      }));

      const commentMap = new Map<string, typeof commentsWithDetails[number]>();
      
      commentsWithDetails.forEach(comment => {
          commentMap.set(comment.id, comment);
      });

      commentsWithDetails.forEach(comment => {
          if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
              const parentComment = commentMap.get(comment.parent_comment_id)!;
              comment.parent_comment_author = parentComment.profiles ? {
                  username: parentComment.profiles.username,
                  telegram_username: parentComment.profiles.telegram_username,
              } : null;
          }
      });

      return commentsWithDetails as Comment[];
    },
  });
};

export const useAddVideoComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { sendCommentNotification } = useTelegramNotifications();

  return useMutation({
    mutationFn: async ({ videoId, content, parentCommentId }: { videoId: string; content: string; parentCommentId?: string }) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      console.log('💬 Добавляем комментарий:', { videoId, content: content.substring(0, 50) + '...', parentCommentId });

      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content: content.trim(),
          parent_comment_id: parentCommentId,
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

export const useLikeVideoComment = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ commentId, videoId, isLiked }: { commentId: string; videoId: string; isLiked: boolean }) => {
            if (!user?.id) {
                throw new Error('Необходима авторизация');
            }

            if (isLiked) {
                const { error } = await supabase
                    .from('video_comment_likes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('comment_id', commentId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('video_comment_likes')
                    .insert({ user_id: user.id, comment_id: commentId });
                if (error) throw error;
            }
            return { videoId };
        },
        onSuccess: (data, variables) => {
            // Оптимистичное обновление не требуется, так как триггер в БД обновит likes_count.
            // Просто инвалидируем кэш, чтобы получить свежие данные (включая user_liked).
            queryClient.invalidateQueries({ queryKey: ['video-comments', variables.videoId] });
        },
        onError: (error) => {
            console.error('Ошибка при лайке комментария:', error);
            toast.error('Не удалось обработать лайк');
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
