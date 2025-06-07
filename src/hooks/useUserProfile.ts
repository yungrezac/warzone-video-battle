
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

      if (profileError) {
        console.error('Ошибка загрузки профиля:', profileError);
        throw profileError;
      }

      // Получаем список видео пользователя
      const { data: userVideos, error: videosError } = await supabase
        .from('videos')
        .select('id')
        .eq('user_id', user.id);

      if (videosError) {
        console.error('Ошибка загрузки видео:', videosError);
        throw videosError;
      }

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

      // Убеждаемся что у пользователя есть запись в user_points
      let userPoints = profile.user_points?.[0];
      
      if (!userPoints) {
        console.log('Создаем запись user_points для пользователя:', user.id);
        const { data: newPoints, error: createPointsError } = await supabase
          .from('user_points')
          .insert({
            user_id: user.id,
            total_points: 0,
            wins_count: 0
          })
          .select()
          .single();

        if (createPointsError) {
          console.error('Ошибка создания user_points:', createPointsError);
          userPoints = { total_points: 0, wins_count: 0 };
        } else {
          userPoints = newPoints;
        }
      }

      console.log('Статистика профиля:', { 
        totalVideos, 
        totalLikes, 
        totalViews,
        points: userPoints?.total_points || 0,
        wins: userPoints?.wins_count || 0
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
