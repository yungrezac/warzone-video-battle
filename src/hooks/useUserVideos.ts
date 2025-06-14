
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
        .select('*') // Можно уточнить select, если average_rating и user_rating там не нужны
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const videosWithStats = await Promise.all(
        (videos || []).map(async (video) => {
          const { count: likesCount, error: likesError } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', video.id);

          if (likesError) {
            console.warn(`⚠️ Ошибка при загрузке лайков для видео ${video.id} (useUserVideos):`, likesError);
          }

          const { count: commentsCount, error: commentsError } = await supabase
            .from('video_comments')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', video.id);

          if (commentsError) {
            console.warn(`⚠️ Ошибка при загрузке комментариев для видео ${video.id} (useUserVideos):`, commentsError);
          }

          // Логика получения averageRating удалена
          // const { data: ratings, error: ratingsError } = await supabase
          //   .from('video_ratings')
          //   .select('rating')
          //   .eq('video_id', video.id);
            
          // if (ratingsError) {
          //   console.warn(`⚠️ Ошибка при загрузке рейтинга для видео ${video.id} (useUserVideos):`, ratingsError);
          // }

          // const averageRating = ratings && ratings.length > 0
          //   ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          //   : 0;

          let userLiked = false;
          // let userRating = 0; // Удалено

          const { data: userLikeData } = await supabase
            .from('video_likes')
            .select('*')
            .eq('video_id', video.id)
            .eq('user_id', user.id)
            .maybeSingle();
          userLiked = !!userLikeData;

          // Логика получения userRatingData удалена
          // const { data: userRatingData } = await supabase
          //   .from('video_ratings')
          //   .select('rating')
          //   .eq('video_id', video.id)
          //   .eq('user_id', user.id)
          //   .maybeSingle();
          // userRating = userRatingData?.rating || 0;

          console.log(`Статистика видео ${video.id}:`, {
            likes: likesCount,
            comments: commentsCount,
            // avgRating: averageRating, // Удалено
            userLiked: userLiked,
            // userRating: userRating // Удалено
          });

          return {
            ...video,
            likes_count: likesCount || video.likes_count || 0,
            comments_count: commentsCount || video.comments_count || 0,
            // average_rating: Number(averageRating.toFixed(1)), // Удалено
            user_liked: userLiked,
            // user_rating: userRating, // Удалено
            thumbnail_url: video.thumbnail_url || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
          };
        })
      );

      console.log('Видео пользователя с обновленной статистикой:', videosWithStats);
      return videosWithStats;
    },
    enabled: !!user,
  });
};
