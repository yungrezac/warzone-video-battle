
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export const useUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Получаем профиль пользователя с баллами одним запросом
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_points (
            total_points,
            wins_count
          )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Получаем статистику видео пользователя одним запросом
      const { data: videoStats, error: videoStatsError } = await supabase
        .from('videos')
        .select(`
          id,
          views,
          video_likes (count),
          video_comments (count)
        `)
        .eq('user_id', user.id);

      if (videoStatsError) throw videoStatsError;

      // Подсчитываем статистику
      const totalVideos = videoStats?.length || 0;
      const totalViews = videoStats?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;
      const totalLikes = videoStats?.reduce((sum, video) => sum + (video.video_likes?.length || 0), 0) || 0;

      const userPoints = profile.user_points?.[0];

      return {
        ...profile,
        total_points: userPoints?.total_points || 0,
        wins_count: userPoints?.wins_count || 0,
        total_videos: totalVideos,
        total_likes: totalLikes,
        total_views: totalViews,
        videos: videoStats || [],
      };
    },
    enabled: !!user,
  });
};
