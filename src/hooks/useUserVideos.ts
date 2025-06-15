
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useEffect } from 'react';

export const useUserVideos = (profileUserId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['user-videos', profileUserId];

  useEffect(() => {
    if (!profileUserId) return;

    const channel = supabase
      .channel(`user-videos-changes-${profileUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos', filter: `user_id=eq.${profileUserId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-videos', profileUserId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_likes' }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-videos', profileUserId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_comments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-videos', profileUserId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_ratings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-videos', profileUserId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, profileUserId]);


  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!profileUserId) return [];

      console.log('Загружаем видео пользователя:', profileUserId);

      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', profileUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Обрабатываем статистику для каждого видео
      const videosWithStats = await Promise.all(
        (videos || []).map(async (video) => {
          // Подсчитываем лайки для каждого видео
          const { count: likesCount, error: likesError } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact', head: true }) // Добавлено head: true
            .eq('video_id', video.id);

          if (likesError) {
            console.warn(`⚠️ Ошибка при загрузке лайков для видео ${video.id} (useUserVideos):`, likesError);
          }

          // Подсчитываем комментарии для каждого видео
          const { count: commentsCount, error: commentsError } = await supabase
            .from('video_comments')
            .select('*', { count: 'exact', head: true }) // Добавлено head: true
            .eq('video_id', video.id);

          if (commentsError) {
            console.warn(`⚠️ Ошибка при загрузке комментариев для видео ${video.id} (useUserVideos):`, commentsError);
          }

          // Подсчитываем средний рейтинг
          const { data: ratingsData, error: ratingsError } = await supabase
            .from('video_ratings' as any)
            .select('rating')
            .eq('video_id', video.id);
            
          if (ratingsError) {
            console.warn(`⚠️ Ошибка при загрузке рейтинга для видео ${video.id} (useUserVideos):`, ratingsError);
          }

          const ratings = ratingsData as unknown as { rating: number }[] | null;

          const averageRating = ratings && ratings.length > 0
            ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratings.length
            : 0;

          // Лайкнул ли текущий пользователь и его рейтинг
          let userLiked = false;
          let userRating = 0;

          if (user) {
            const { data: userLikeData } = await supabase
              .from('video_likes')
              .select('*')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userLiked = !!userLikeData;
  
            const { data: userRatingData } = await supabase
              .from('video_ratings' as any)
              .select('rating')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userRating = (userRatingData as unknown as { rating: number } | null)?.rating || 0;
          }

          console.log(`Статистика видео ${video.id}:`, {
            likes: likesCount,
            comments: commentsCount,
            avgRating: averageRating,
            userLiked: userLiked,
            userRating: userRating
          });

          return {
            ...video,
            likes_count: likesCount || video.likes_count || 0, // Используем актуальное, затем из таблицы, затем 0
            comments_count: commentsCount || video.comments_count || 0, // Используем актуальное, затем из таблицы, затем 0
            average_rating: Number(averageRating.toFixed(1)),
            user_liked: userLiked,
            user_rating: userRating,
            thumbnail_url: video.thumbnail_url || 'https://i.postimg.cc/hGHyN1Z1/1eb82307-57c9-4efe-b3c2-5d1d49767f4c.png',
          };
        })
      );

      console.log('Видео пользователя с обновленной статистикой:', videosWithStats);
      return videosWithStats;
    },
    enabled: !!profileUserId,
  });
};
