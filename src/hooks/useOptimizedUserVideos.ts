
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useMemo } from 'react';

export const useOptimizedUserVideos = () => {
  const { user } = useAuth();

  const queryKey = useMemo(() => ['optimized-user-videos', user?.id], [user?.id]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      console.log('⚡ Быстрая загрузка видео пользователя:', user.id);

      // Оптимизированный запрос с минимальными данными
      const { data: videos, error } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          video_url,
          thumbnail_url,
          user_id,
          category,
          views,
          likes_count,
          comments_count,
          created_at,
          is_winner
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!videos || videos.length === 0) {
        return [];
      }

      // Батчевая загрузка лайков пользователя
      const videoIds = videos.map(v => v.id);
      const { data: userLikes } = await supabase
        .from('video_likes')
        .select('video_id')
        .eq('user_id', user.id)
        .in('video_id', videoIds);

      const likedVideoIds = new Set(userLikes?.map(l => l.video_id) || []);

      const optimizedVideos = videos.map(video => ({
        ...video,
        user_liked: likedVideoIds.has(video.id),
        thumbnail_url: video.thumbnail_url || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
      }));

      console.log('✅ Оптимизированные видео пользователя загружены:', optimizedVideos.length);
      return optimizedVideos;
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000, // 3 минуты
    gcTime: 10 * 60 * 1000, // 10 минут
  });
};
