
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useEffect, useRef } from 'react';

export const useUserProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const queryKey = ['user-profile', userId];
  const uniqueChannelId = useRef(Math.random());

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-profile-changes-${userId}:${uniqueChannelId.current}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_points', filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos', filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_likes' }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      console.log('Загружаем профиль пользователя:', user.id);

      // Получаем профиль пользователя
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Ошибка загрузки профиля:', profileError);
        throw profileError;
      }

      // Получаем баллы пользователя отдельным запросом
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points, wins_count')
        .eq('user_id', user.id)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') {
        console.error('Ошибка загрузки баллов:', pointsError);
      }

      // Если баллов нет, создаем запись
      let finalPoints = userPoints;
      if (!userPoints) {
        console.log('Создаем запись user_points для пользователя:', user.id);
        const { data: newPoints, error: createPointsError } = await supabase
          .from('user_points')
          .insert({
            user_id: user.id,
            total_points: 0,
            wins_count: 0
          })
          .select('total_points, wins_count')
          .single();

        if (createPointsError) {
          console.error('Ошибка создания user_points:', createPointsError);
          finalPoints = { total_points: 0, wins_count: 0 };
        } else {
          finalPoints = newPoints;
        }
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

      console.log('Статистика профиля:', { 
        totalVideos, 
        totalLikes, 
        totalViews,
        points: finalPoints?.total_points || 0,
        wins: finalPoints?.wins_count || 0
      });

      return {
        ...profile,
        total_points: finalPoints?.total_points || 0,
        wins_count: finalPoints?.wins_count || 0,
        total_videos: totalVideos,
        total_likes: totalLikes,
        total_views: totalViews,
        videos: userVideos || [],
      };
    },
    enabled: !!user,
  });
};
