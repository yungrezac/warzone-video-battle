
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useMemo } from 'react';

interface OptimizedVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  user_id: string;
  category: 'Rollers' | 'BMX' | 'Skateboard';
  views: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_liked: boolean;
  profiles?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    telegram_username?: string;
    avatar_url?: string;
  };
  is_winner?: boolean;
}

export const useOptimizedVideos = (page = 0, limit = 10) => {
  const { user } = useAuth();
  
  const queryKey = useMemo(() => ['optimized-videos', user?.id, page, limit], [user?.id, page, limit]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('🚀 Загружаем оптимизированную ленту видео...');

      const start = page * limit;
      const end = start + limit - 1;

      // Один оптимизированный запрос с пагинацией
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
          is_winner,
          profiles:user_id (
            username,
            first_name,
            last_name,
            telegram_username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) {
        console.error('❌ Ошибка загрузки видео:', error);
        throw error;
      }

      if (!videos || videos.length === 0) {
        return [];
      }

      // Батчевая загрузка лайков пользователя одним запросом
      let userLikes: string[] = [];
      if (user?.id) {
        const videoIds = videos.map(v => v.id);
        const { data: likesData } = await supabase
          .from('video_likes')
          .select('video_id')
          .eq('user_id', user.id)
          .in('video_id', videoIds);
        
        userLikes = likesData?.map(l => l.video_id) || [];
      }

      // Маппинг видео с оптимизированными данными
      const optimizedVideos: OptimizedVideo[] = videos.map(video => ({
        ...video,
        user_liked: userLikes.includes(video.id),
        thumbnail_url: video.thumbnail_url || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
      }));

      console.log('✅ Оптимизированные видео загружены:', optimizedVideos.length);
      return optimizedVideos;
    },
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 5 * 60 * 1000, // 5 минут
  });
};
