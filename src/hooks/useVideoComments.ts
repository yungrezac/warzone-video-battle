
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useVideoComments = (videoId: string) => {
  return useQuery({
    queryKey: ['video-comments', videoId],
    queryFn: async () => {
      console.log('📥 useVideoComments: Загружаем комментарии для видео:', videoId);

      const { data, error } = await supabase
        .from('video_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            username,
            telegram_username,
            avatar_url
          )
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ useVideoComments: Ошибка загрузки комментариев:', error);
        throw error;
      }

      console.log('✅ useVideoComments: Комментарии загружены:', data);
      return data || [];
    },
    enabled: !!videoId,
  });
};

export const useAddVideoComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, content }: { videoId: string; content: string }) => {
      console.log('💬 useAddVideoComment: Добавляем комментарий', { videoId, content });

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Пользователь не авторизован');
      }

      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content: content.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ useAddVideoComment: Ошибка при добавлении комментария:', error);
        throw error;
      }

      console.log('✅ useAddVideoComment: Комментарий добавлен:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      console.log('🔄 useAddVideoComment: Обновляем кэш после добавления комментария');
      
      // Обновляем кэш комментариев
      queryClient.invalidateQueries({ queryKey: ['video-comments', variables.videoId] });
      
      // Обновляем кэш видео для обновления счетчика комментариев
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      
      toast.success('Комментарий добавлен');
    },
    onError: (error) => {
      console.error('❌ useAddVideoComment: Ошибка мутации комментария:', error);
      toast.error('Ошибка при добавлении комментария');
    }
  });
};
