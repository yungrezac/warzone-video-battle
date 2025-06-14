
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useVideos = () => {
  return useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      console.log('📥 useVideos: Загружаем список видео');

      const { data: { user } } = await supabase.auth.getUser();

      const { data: videos, error } = await supabase
        .from('videos')
        .select(`
          *,
          profiles:user_id (
            username,
            telegram_username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ useVideos: Ошибка загрузки видео:', error);
        throw error;
      }

      if (!videos) {
        console.log('📭 useVideos: Видео не найдены');
        return [];
      }

      console.log('📊 useVideos: Получаем статистику для видео');

      const videosWithStats = await Promise.all(
        videos.map(async (video) => {
          // Получаем количество лайков
          const { count: likesCount } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          // Получаем количество комментариев
          const { count: commentsCount } = await supabase
            .from('video_comments')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          // Получаем рейтинги
          const { data: ratings } = await supabase
            .from('video_ratings')
            .select('rating')
            .eq('video_id', video.id);

          const averageRating = ratings && ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

          let userLiked = false;
          let userRating = 0;

          if (user?.id) {
            // Проверяем, лайкнул ли пользователь видео
            const { data: userLike } = await supabase
              .from('video_likes')
              .select('*')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .maybeSingle();

            userLiked = !!userLike;

            // Получаем рейтинг пользователя
            const { data: userRatingData } = await supabase
              .from('video_ratings')
              .select('rating')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .maybeSingle();

            userRating = userRatingData?.rating || 0;
          }

          return {
            ...video,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            average_rating: Number(averageRating.toFixed(1)),
            user_liked: userLiked,
            user_rating: userRating,
          };
        })
      );

      console.log('✅ useVideos: Видео с статистикой загружены:', videosWithStats.length);
      return videosWithStats;
    },
  });
};

export const useRateVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, rating }: { videoId: string; rating: number }) => {
      console.log('⭐ useRateVideo: Ставим оценку видео', { videoId, rating });

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Пользователь не авторизован');
      }

      const { error } = await supabase
        .from('video_ratings')
        .upsert({
          video_id: videoId,
          user_id: user.id,
          rating: rating
        });

      if (error) {
        console.error('❌ useRateVideo: Ошибка при выставлении оценки:', error);
        throw error;
      }

      console.log('✅ useRateVideo: Оценка успешно поставлена');
      return { videoId, rating };
    },
    onSuccess: () => {
      console.log('🔄 useRateVideo: Обновляем кэш после выставления оценки');
      
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      console.error('❌ useRateVideo: Ошибка мутации оценки:', error);
      toast.error('Ошибка при выставлении оценки');
    }
  });
};
