import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useAchievementTriggers } from './useAchievementTriggers';
import { useTelegramNotifications } from './useTelegramNotifications';

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  user_id: string;
  views: number;
  created_at: string;
  updated_at: string;
  is_winner?: boolean;
  winner_date?: string;
  user?: {
    id: string;
    username?: string;
    telegram_username?: string;
    avatar_url?: string;
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
    queryKey: ['videos', user?.id],
    queryFn: async () => {
      console.log('Загружаем видео для пользователя:', user?.id);
      
      // Получаем видео
      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки видео:', error);
        throw error;
      }

      // Получаем дополнительную статистику для каждого видео
      const videosWithStats = await Promise.all(
        videos.map(async (video) => {
          // Получаем информацию о пользователе
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('username, avatar_url, telegram_username')
            .eq('id', video.user_id)
            .single();

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

          // Лайкнул ли текущий пользователь и его рейтинг
          let userLiked = false;
          let userRating = 0;

          if (user?.id) {
            const { data: userLike } = await supabase
              .from('video_likes')
              .select('*')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .maybeSingle();

            userLiked = !!userLike;

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
            user: userProfile,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            average_rating: Number(averageRating.toFixed(1)),
            user_liked: userLiked,
            user_rating: userRating,
            thumbnail_url: video.thumbnail_url || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
          };
        })
      );

      console.log('Видео с статистикой загружены:', videosWithStats);
      return videosWithStats;
    },
  });
};

export const useLikeVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { triggerSocialLike } = useAchievementTriggers();
  const { sendLikeNotification } = useTelegramNotifications();

  return useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Mutation - Like video:', videoId, 'isLiked:', isLiked);

      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: user.id,
          });

        if (error) throw error;
        
        // Trigger achievement for liking other videos
        triggerSocialLike();

        // Отправляем уведомление владельцу видео
        try {
          const { data: video } = await supabase
            .from('videos')
            .select(`
              title,
              user_id,
              user:profiles!user_id(telegram_id, username, first_name)
            `)
            .eq('id', videoId)
            .single();

          if (video && video.user?.telegram_id && video.user_id !== user.id) {
            const likerName = user.first_name || user.username || 'Роллер';
            await sendLikeNotification(video.user.telegram_id, likerName, video.title);
          }
        } catch (notificationError) {
          console.error('Ошибка отправки уведомления о лайке:', notificationError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
    },
  });
};

export const useRateVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { triggerSocialRating } = useAchievementTriggers();

  return useMutation({
    mutationFn: async ({ videoId, rating }: { videoId: string; rating: number }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Mutation - Rate video:', videoId, 'rating:', rating);

      const { error } = await supabase
        .from('video_ratings')
        .upsert({
          video_id: videoId,
          user_id: user.id,
          rating: rating,
        });

      if (error) throw error;
      
      // Trigger achievement for rating other videos
      triggerSocialRating();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
    },
  });
};

export const useUploadVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { triggerVideoUpload } = useAchievementTriggers();

  return useMutation({
    mutationFn: async ({ 
      title, 
      description, 
      videoFile 
    }: { 
      title: string; 
      description?: string; 
      videoFile: File; 
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Starting video upload...');

      // Generate a unique filename
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading file to storage...', filePath);

      // Upload video file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, videoFile);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      console.log('File uploaded, creating database record...', publicUrl);

      // Create video record in database
      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert({
          title,
          description,
          video_url: publicUrl,
          user_id: user.id,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      console.log('Video record created successfully:', videoData);
      
      // Trigger achievement for uploading video
      triggerVideoUpload();

      return videoData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};
