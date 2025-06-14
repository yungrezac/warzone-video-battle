
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

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

      if (error) throw error;
      return data || [];
    },
  });
};

export const useAddVideoComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ videoId, content }: { videoId: string; content: string }) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

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

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Инвалидируем кэши для обновления комментариев и баллов
      queryClient.invalidateQueries({ queryKey: ['video-comments', data.video_id] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
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

      const { error } = await supabase
        .from('video_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { commentId, videoId };
    },
    onSuccess: (data) => {
      // Инвалидируем кэши для обновления комментариев и баллов
      queryClient.invalidateQueries({ queryKey: ['video-comments', data.videoId] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};
