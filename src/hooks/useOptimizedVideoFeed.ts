
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOptimizedVideoFeed = (limit: number = 20) => {
  return useQuery({
    queryKey: ['video-feed-optimized', limit],
    queryFn: async () => {
      console.log('🚀 Загружаем оптимизированную ленту видео...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('videos')
        .select(`
          id,
          title,
          video_url,
          thumbnail_url,
          category,
          created_at,
          views,
          likes_count,
          comments_count,
          profiles!videos_user_id_fkey (
            id,
            username,
            first_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      // If user is authenticated, also get their like status
      if (user) {
        query = supabase
          .from('videos')
          .select(`
            id,
            title,
            video_url,
            thumbnail_url,
            category,
            created_at,
            views,
            likes_count,
            comments_count,
            profiles!videos_user_id_fkey (
              id,
              username,
              first_name,
              avatar_url
            ),
            video_likes!left (
              user_id
            )
          `)
          .order('created_at', { ascending: false })
          .limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Ошибка загрузки видео:', error);
        throw error;
      }

      // Process data to add user_liked flag
      const processedData = data?.map(video => ({
        ...video,
        user_liked: user && (video as any).video_likes && (video as any).video_likes.length > 0
      })) || [];

      console.log(`✅ Загружено ${processedData.length} видео`);
      return processedData;
    },
    staleTime: 30000, // 30 секунд
    gcTime: 5 * 60 * 1000, // 5 минут
    refetchOnWindowFocus: false,
  });
};
