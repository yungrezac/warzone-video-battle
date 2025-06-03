
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

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
      const { data: comments, error } = await supabase
        .from('video_comments')
        .select(`
          *,
          user:profiles!user_id(username, telegram_username, avatar_url)
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return comments as VideoComment[];
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ videoId, content }: { videoId: string; content: string }) => {
      if (!user) throw new Error('User not authenticated');

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

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { videoId }) => {
      // Инвалидируем и обновляем кэш комментариев для данного видео
      queryClient.invalidateQueries({ queryKey: ['video-comments', videoId] });
      // Также обновляем счетчик комментариев в списке видео
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};
