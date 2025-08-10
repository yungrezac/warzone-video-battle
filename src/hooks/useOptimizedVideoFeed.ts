
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOptimizedVideoFeed = (limit: number = 20) => {
  return useQuery({
    queryKey: ['video-feed-optimized', limit],
    queryFn: async () => {
      console.log('🚀 Загружаем оптимизированную ленту видео...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          video_url,
          thumbnail_url,
          category,
          created_at,
          views,
          user_id,
          profiles!videos_user_id_fkey (
            id,
            username,
            first_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Ошибка загрузки видео:', error);
        throw error;
      }

      // Process data to add likes count and user interaction data
      const videosWithStats = await Promise.all(
        (data || []).map(async (video) => {
          // Подсчитываем лайки для каждого видео
          const { count: likesCount } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', video.id);

          // Подсчитываем комментарии для каждого видео
          const { count: commentsCount } = await supabase
            .from('video_comments')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', video.id);

          // Проверяем, лайкнул ли текущий пользователь это видео
          let userLiked = false;
          if (user) {
            const { data: userLikeData } = await supabase
              .from('video_likes')
              .select('*')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userLiked = !!userLikeData;
          }

          return {
            ...video,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            user_liked: userLiked
          };
        })
      );

      console.log(`✅ Загружено ${videosWithStats.length} видео с актуальной статистикой`);
      return videosWithStats;
    },
    staleTime: 30000, // 30 секунд
    gcTime: 5 * 60 * 1000, // 5 минут
    refetchOnWindowFocus: false,
  });
};
