
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

  return useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      if (!user?.id) {
        console.error('Пользователь не авторизован');
        throw new Error('User not authenticated');
      }

      console.log('Обрабатываем лайк:', { videoId, isLiked, userId: user.id });

      if (isLiked) {
        // Убираем лайк
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Ошибка удаления лайка:', error);
          throw error;
        }
        console.log('Лайк удален');
      } else {
        // Ставим лайк
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: user.id,
          });

        if (error) {
          console.error('Ошибка добавления лайка:', error);
          throw error;
        }
        console.log('Лайк добавлен');
      }
    },
    onSuccess: () => {
      console.log('Лайк успешно обработан, обновляем кэш');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      console.error('Ошибка обработки лайка:', error);
    },
  });
};

export const useRateVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ videoId, rating }: { videoId: string; rating: number }) => {
      if (!user?.id) {
        console.error('Пользователь не авторизован');
        throw new Error('User not authenticated');
      }

      console.log('Обрабатываем рейтинг:', { videoId, rating, userId: user.id });

      const { error } = await supabase
        .from('video_ratings')
        .upsert({
          video_id: videoId,
          user_id: user.id,
          rating,
        });

      if (error) {
        console.error('Ошибка установки рейтинга:', error);
        throw error;
      }
      
      console.log('Рейтинг установлен');
    },
    onSuccess: () => {
      console.log('Рейтинг успешно установлен, обновляем кэш');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      console.error('Ошибка установки рейтинга:', error);
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
      if (!user?.id) throw new Error('User not authenticated');

      // Создаем уникальное имя файла
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log('Загружаем видео:', fileName);
      
      // Загружаем видео в Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile);

      if (uploadError) {
        console.error('Ошибка загрузки видео:', uploadError);
        throw uploadError;
      }

      console.log('Видео загружено:', uploadData);

      // Получаем публичный URL загруженного видео
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      console.log('Публичный URL видео:', urlData.publicUrl);

      // Создаем запись в базе данных
      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert({
          title,
          description,
          video_url: urlData.publicUrl,
          thumbnail_url: `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop`,
          user_id: user.id,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Ошибка создания записи в БД:', dbError);
        throw dbError;
      }

      console.log('Запись в БД создана:', videoData);
      return videoData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};
