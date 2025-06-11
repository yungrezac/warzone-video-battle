import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useTelegramNotifications } from './useTelegramNotifications';

interface Video {
  id: string;
  created_at: string;
  title: string;
  video_url: string;
  thumbnail_url: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  average_rating: number;
  views: number;
  is_winner: boolean;
  user_liked: boolean;
  user_rating: number;
  category: 'Rollers' | 'BMX' | 'Skateboard';
  profiles?: {
    username?: string;
    telegram_username?: string;
    avatar_url?: string;
  };
}

interface VideoLike {
  video_id: string;
  user_id: string;
}

interface VideoRating {
  video_id: string;
  user_id: string;
  rating: number;
}

export const useVideos = () => {
  return useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          profiles (
            username,
            telegram_username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка при загрузке видео:', error);
        throw error;
      }

      const videosWithStats = await Promise.all(
        (data || []).map(async (video) => {
          const { count: likesCount } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          const { count: commentsCount } = await supabase
            .from('video_comments')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          const { data: ratings } = await supabase
            .from('video_ratings')
            .select('rating')
            .eq('video_id', video.id);

          const averageRating = ratings && ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

          const { data: viewsData } = await supabase
            .from('videos')
            .select('views')
            .eq('id', video.id)
            .single();

          const views = viewsData ? viewsData.views : 0;

          let userLiked = false;
          let userRating = 0;

          // Получаем текущего пользователя
          const user = supabase.auth.getUser();
          const userId = (await user).data?.user?.id;

          if (userId) {
            const { data: userLike } = await supabase
              .from('video_likes')
              .select('*')
              .eq('video_id', video.id)
              .eq('user_id', userId)
              .maybeSingle();

            userLiked = !!userLike;

            const { data: userRatingData } = await supabase
              .from('video_ratings')
              .select('rating')
              .eq('video_id', video.id)
              .eq('user_id', userId)
              .maybeSingle();

            userRating = userRatingData?.rating || 0;
          }

          return {
            ...video,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            average_rating: Number(averageRating.toFixed(1)),
            views: views,
            user_liked: userLiked,
            user_rating: userRating,
            thumbnail_url: video.thumbnail_url || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
          };
        })
      );

      return videosWithStats as Video[];
    },
  });
};

export const useLikeVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { sendLikeNotification } = useTelegramNotifications();

  return useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      console.log('🔄 Обрабатываем лайк:', { videoId, isLiked, userId: user.id });

      if (isLiked) {
        // Убираем лайк
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Уменьшаем счетчик
        await supabase.rpc('decrement_likes_count', { video_id: videoId });
      } else {
        // Ставим лайк
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: user.id,
          });

        if (error) throw error;

        // Увеличиваем счетчик
        await supabase.rpc('increment_likes_count', { video_id: videoId });

        // Отправляем уведомление владельцу видео
        try {
          const { data: videoData } = await supabase
            .from('videos')
            .select(`
              title,
              user_id,
              profiles!inner(telegram_id, username, telegram_username)
            `)
            .eq('id', videoId)
            .single();

          if (videoData && videoData.profiles && videoData.user_id !== user.id) {
            const ownerTelegramId = videoData.profiles.telegram_id;
            const likerName = user.username || user.telegram_username || 'Пользователь';
            
            if (ownerTelegramId) {
              await sendLikeNotification(
                videoData.user_id,
                ownerTelegramId,
                likerName,
                videoData.title
              );
            }
          }
        } catch (error) {
          console.error('Ошибка отправки уведомления о лайке:', error);
        }
      }

      return { videoId, isLiked: !isLiked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
    },
    onError: (error) => {
      console.error('Ошибка при обработке лайка:', error);
    },
  });
};

export const useRateVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ videoId, rating }: { videoId: string; rating: number }) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      // Проверяем, ставил ли пользователь уже оценку
      const { data: existingRating } = await supabase
        .from('video_ratings')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRating) {
        // Обновляем существующую оценку
        const { error } = await supabase
          .from('video_ratings')
          .update({ rating })
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Создаем новую оценку
        const { error } = await supabase
          .from('video_ratings')
          .insert({
            video_id: videoId,
            user_id: user.id,
            rating,
          });

        if (error) throw error;
      }

      return { videoId, rating };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
    },
    onError: (error) => {
      console.error('Ошибка при выставлении оценки:', error);
    },
  });
};
