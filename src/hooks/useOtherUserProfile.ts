import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export const useOtherUserProfile = (userId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['other-user-profile', userId];

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`other-user-profile-changes-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_points', filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_achievements', filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos', filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      console.log('Загружаем профиль пользователя:', userId);

      // Получаем профиль пользователя
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, followers_count, following_count')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Ошибка загрузки профиля:', profileError);
        throw profileError;
      }

      // Получаем баллы пользователя
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points, wins_count')
        .eq('user_id', userId)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') {
        console.error('Ошибка загрузки баллов:', pointsError);
      }

      // Получаем достижения пользователя
      const { data: userAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .eq('is_completed', true);

      if (achievementsError) {
        console.error('Ошибка загрузки достижений:', achievementsError);
      }

      // Получаем список видео пользователя
      const { data: userVideos, error: videosError } = await supabase
        .from('videos')
        .select('id')
        .eq('user_id', userId);

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
          .eq('user_id', userId);

        totalViews = viewsData?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;
      }

      console.log('Статистика профиля:', { 
        totalVideos, 
        totalLikes, 
        totalViews,
        points: userPoints?.total_points || 0,
        wins: userPoints?.wins_count || 0,
        achievements: userAchievements?.length || 0
      });

      return {
        ...profile,
        total_points: userPoints?.total_points || 0,
        wins_count: userPoints?.wins_count || 0,
        total_videos: totalVideos,
        total_likes: totalLikes,
        total_views: totalViews,
        total_achievements: userAchievements?.length || 0,
        recent_achievements: userAchievements?.slice(-3) || [],
        videos: userVideos || [],
      };
    },
    enabled: !!userId,
  });
};
