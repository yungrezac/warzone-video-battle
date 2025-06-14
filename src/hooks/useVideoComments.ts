import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useTelegramNotifications } from './useTelegramNotifications';
import { toast } from 'sonner';
import { useEffect } from 'react';

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
  parent_comment_author?: {
    username: string | null;
    telegram_username: string | null;
  } | null;
  parent_comment_content?: string | null;
}

export const useVideoComments = (videoId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['video-comments', videoId];
  
  useEffect(() => {
    const channel = supabase
      .channel(`video-comments-changes-${videoId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_comments', filter: `video_id=eq.${videoId}` }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_comment_likes' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId, queryClient]);
  
  return useQuery({
    queryKey,
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

      const commentsWithDetails: (Omit<Comment, 'parent_comment_author' | 'parent_comment_content'> & { user_liked: boolean, parent_comment_author?: any, parent_comment_content?: string | null })[] = comments.map(comment => ({
        ...comment,
        user_liked: userLikedCommentIds.includes(comment.id),
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
              comment.parent_comment_content = parentComment.content;
          }
      });

      return commentsWithDetails as Comment[];
    },
  });
};

export const useAddVideoComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { sendCommentNotification, sendCommentReplyNotification } = useTelegramNotifications();

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

      if (data.parent_comment_id) {
        // Это ответ. Уведомляем автора родительского комментария.
        try {
          const { data: parentCommentData } = await supabase
            .from('video_comments')
            .select(`
              user_id,
              profiles:user_id (telegram_id),
              videos (title)
            `)
            .eq('id', data.parent_comment_id)
            .single();

          if (parentCommentData && parentCommentData.profiles && parentCommentData.user_id !== user.id && parentCommentData.profiles.telegram_id) {
              const replierName = user.username || user.telegram_username || 'Пользователь';
              const videoTitle = parentCommentData.videos?.title || 'ваше';
              await sendCommentReplyNotification(
                parentCommentData.user_id,
                parentCommentData.profiles.telegram_id,
                replierName,
                data.content,
                videoTitle
              );
          }
        } catch (e) {
          console.error('Ошибка отправки уведомления об ответе на комментарий:', e);
        }
      } else {
        // Это комментарий верхнего уровня. Уведомляем владельца видео.
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
    const { sendCommentLikeNotification } = useTelegramNotifications();

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
                if (error) {
                    console.error('Ошибка supabase при удалении лайка:', error);
                    throw error;
                }
            } else {
                const { data, error } = await supabase
                    .from('video_comment_likes')
                    .insert({ user_id: user.id, comment_id: commentId })
                    .select()
                    .single();

                if (error) {
                    console.error('Ошибка supabase при добавлении лайка:', error);
                    throw error;
                }
                
                try {
                    const { data: commentData } = await supabase
                        .from('video_comments')
                        .select('content, user_id, profiles:user_id(telegram_id)')
                        .eq('id', commentId)
                        .single();
                    
                    if (commentData && commentData.profiles && commentData.user_id !== user.id && commentData.profiles.telegram_id) {
                        const likerName = user.username || user.telegram_username || 'Пользователь';
                        await sendCommentLikeNotification(
                            commentData.user_id,
                            commentData.profiles.telegram_id,
                            likerName,
                            commentData.content
                        );
                    }
                } catch(e) {
                    console.error("Ошибка отправки уведомления о лайке комментария:", e);
                }
            }
            return { videoId };
        },
        onSuccess: (data, variables) => {
            // Оптимистичное обновление не требуется, так как триггер в БД обновит likes_count.
            // Просто инвалидируем кэш, чтобы получить свежие данные (включая user_liked).
            queryClient.invalidateQueries({ queryKey: ['video-comments', variables.videoId] });
        },
        onError: (error: any, variables) => {
            let errorMessage = 'Не удалось обработать лайк.';
            if (error?.code === '23505') { // Unique constraint violation
                errorMessage = 'Вы уже лайкнули этот комментарий.';
                console.warn('Обнаружена попытка дублирующего лайка. Возможно, состояние UI не синхронизировано.');
            } else if (error?.message?.includes('violates row-level security policy')) {
                errorMessage = 'Ошибка прав доступа. Попробуйте перезайти.';
                console.error('Сработала блокировка RLS при лайке.');
            } else {
                console.error('Ошибка при лайке комментария:', error);
            }
            
            toast.error(errorMessage);
            // При ошибке откатываем оптимистичное обновление, перезагружая данные
            queryClient.invalidateQueries({ queryKey: ['video-comments', variables.videoId] });
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
