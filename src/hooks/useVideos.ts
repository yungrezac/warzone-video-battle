
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  views: number;
  is_winner: boolean;
  winner_date?: string;
  created_at: string;
  user_id: string;
  user?: {
    username?: string;
    avatar_url?: string;
    telegram_username?: string;
  };
  likes_count?: number;
  comments_count?: number;
  average_rating?: number;
  user_liked?: boolean;
  user_rating?: number;
}

export const useVideos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data: videos, error } = await supabase
        .from('videos')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            telegram_username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Получаем дополнительную статистику для каждого видео
      const videosWithStats = await Promise.all(
        videos.map(async (video) => {
          // Количество лайков
          const { count: likesCount } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          // Количество комментариев
          const { count: commentsCount } = await supabase
            .from('video_comments')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          // Средний рейтинг
          const { data: ratings } = await supabase
            .from('video_ratings')
            .select('rating')
            .eq('video_id', video.id);

          const averageRating = ratings && ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

          // Лайкнул ли текущий пользователь
          let userLiked = false;
          let userRating = 0;

          if (user) {
            const { data: userLike } = await supabase
              .from('video_likes')
              .select('*')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .single();

            userLiked = !!userLike;

            const { data: userRatingData } = await supabase
              .from('video_ratings')
              .select('rating')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .single();

            userRating = userRatingData?.rating || 0;
          }

          return {
            ...video,
            user: video.profiles,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            average_rating: Number(averageRating.toFixed(1)),
            user_liked: userLiked,
            user_rating: userRating,
          };
        })
      );

      return videosWithStats;
    },
    enabled: !!user,
  });
};

export const useLikeVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      if (!user) throw new Error('User not authenticated');

      if (isLiked) {
        // Убираем лайк
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Ставим лайк
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};

export const useRateVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ videoId, rating }: { videoId: string; rating: number }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('video_ratings')
        .upsert({
          video_id: videoId,
          user_id: user.id,
          rating,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};

export const useUploadVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ title, description, videoFile }: { 
      title: string; 
      description?: string; 
      videoFile: File;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Здесь будет логика загрузки файла в Supabase Storage
      // Пока что просто создаем запись с mock URL
      const { error } = await supabase
        .from('videos')
        .insert({
          title,
          description,
          video_url: `https://example.com/videos/${Date.now()}.mp4`,
          thumbnail_url: `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop`,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};
