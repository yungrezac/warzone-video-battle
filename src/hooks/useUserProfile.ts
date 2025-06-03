
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export const useUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      console.log('Загружаем профиль пользователя:', user.id);

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

      // Получаем список видео пользователя
      const { data: userVideos, error: videosError } = await supabase
        .from('videos')
        .select('id')
        .eq('user_id', user.id);

      if (videosError) throw videosError;

      const videoIds = userVideos?.map(v => v.id) || [];
      const totalVideos = videoIds.length;

      let totalLikes = 0;
      let totalViews = 0;

      if (videoIds.length > 0) {
        // Подсчитываем общее количество лайков для всех видео пользователя
        const { count: likesCount } = await supabase
          .from('video_likes')
          .select('*', { count: 'exact' })
          .in('video_id', videoIds);

        totalLikes = likesCount || 0;

        // Подсчитываем общее количество просмотров
        const { data: viewsData } = await supabase
          .from('videos')
          .select('views')
          .eq('user_id', user.id);

        totalViews = viewsData?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;
      }

      const userPoints = profile.user_points?.[0];

      console.log('Статистика профиля:', { 
        totalVideos, 
        totalLikes, 
        totalViews,
        videoIds: videoIds.length 
      });

      return {
        ...profile,
        total_points: userPoints?.total_points || 0,
        wins_count: userPoints?.wins_count || 0,
        total_videos: totalVideos,
        total_likes: totalLikes,
        total_views: totalViews,
        videos: userVideos || [],
      };
    },
    enabled: !!user,
  });
};
