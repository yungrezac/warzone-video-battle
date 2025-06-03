
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
          // Подсчитываем лайки для каждого видео
          const { count: likesCount } = await supabase
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
            likes: likesCount,
            comments: commentsCount,
            avgRating: averageRating,
            userLiked: !!userLike,
            userRating: userRatingData?.rating || 0
          });

          return {
            ...video,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            average_rating: Number(averageRating.toFixed(1)),
            user_liked: !!userLike,
            user_rating: userRatingData?.rating || 0,
            // Обновляем thumbnail для роликов
            thumbnail_url: video.thumbnail_url || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
          };
        })
      );

      console.log('Видео с обновленной статистикой:', videosWithStats);
      return videosWithStats;
    },
    enabled: !!user,
  });
};
