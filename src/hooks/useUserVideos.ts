
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export const useUserVideos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-videos', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      console.log('Загружаем видео пользователя:', user.id);

      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Обрабатываем статистику для каждого видео
      const videosWithStats = await Promise.all(
        (videos || []).map(async (video) => {
          // Подсчитываем лайки напрямую из таблицы video_likes
          const { count: actualLikesCount } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          // Подсчитываем комментарии для каждого видео
          const { count: commentsCount } = await supabase
            .from('video_comments')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          // Подсчитываем средний рейтинг
          const { data: ratings } = await supabase
            .from('video_ratings')
            .select('rating')
            .eq('video_id', video.id);

          const averageRating = ratings && ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

          // Лайкнул ли текущий пользователь и его рейтинг
          const { data: userLike } = await supabase
            .from('video_likes')
            .select('*')
            .eq('video_id', video.id)
            .eq('user_id', user.id)
            .maybeSingle();

          const { data: userRatingData } = await supabase
            .from('video_ratings')
            .select('rating')
            .eq('video_id', video.id)
            .eq('user_id', user.id)
            .maybeSingle();

          console.log(`Статистика видео ${video.id}:`, {
            likes: actualLikesCount,
            comments: commentsCount,
            avgRating: averageRating,
            userLiked: !!userLike,
            userRating: userRatingData?.rating || 0
          });

          return {
            ...video,
            likes_count: actualLikesCount || 0, // Используем реальный подсчет лайков
            comments_count: commentsCount || 0,
            average_rating: Number(averageRating.toFixed(1)),
            user_liked: !!userLike,
            user_rating: userRatingData?.rating || 0,
            // Обновляем thumbnail для роликов с роллерской тематикой
            thumbnail_url: video.thumbnail_url || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
          };
        })
      );

      console.log('Видео с обновленной статистикой:', videosWithStats);
      return videosWithStats;
    },
    enabled: !!user,
  });
};
