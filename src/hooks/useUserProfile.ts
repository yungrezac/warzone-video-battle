
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export const useUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Получаем профиль пользователя
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Получаем баллы пользователя
      const { data: points, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (pointsError) throw pointsError;

      // Получаем количество видео пользователя
      const { count: videosCount } = await supabase
        .from('videos')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Получаем общее количество лайков на всех видео пользователя
      const { data: userVideos } = await supabase
        .from('videos')
        .select('id')
        .eq('user_id', user.id);

      let totalLikes = 0;
      let totalViews = 0;

      if (userVideos && userVideos.length > 0) {
        for (const video of userVideos) {
          const { count: likesCount } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          totalLikes += likesCount || 0;
        }

        const { data: viewsData } = await supabase
          .from('videos')
          .select('views')
          .eq('user_id', user.id);

        totalViews = viewsData?.reduce((sum, v) => sum + v.views, 0) || 0;
      }

      return {
        ...profile,
        total_points: points?.total_points || 0,
        wins_count: points?.wins_count || 0,
        total_videos: videosCount || 0,
        total_likes: totalLikes,
        total_views: totalViews,
      };
    },
    enabled: !!user,
  });
};
