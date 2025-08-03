
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOptimizedVideoFeed = (limit: number = 20) => {
  return useQuery({
    queryKey: ['video-feed-optimized', limit],
    queryFn: async () => {
      console.log('🚀 Загружаем оптимизированную ленту видео...');
      
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

      if (error) {
        console.error('❌ Ошибка загрузки видео:', error);
        throw error;
      }

      console.log(`✅ Загружено ${data?.length || 0} видео`);
      return data || [];
    },
    staleTime: 30000, // 30 секунд
    gcTime: 5 * 60 * 1000, // 5 минут (заменил cacheTime на gcTime)
    refetchOnWindowFocus: false,
  });
};
