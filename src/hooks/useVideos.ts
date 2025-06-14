
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { generateQuickThumbnail } from '@/utils/videoOptimization';

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  user_id: string;
  category: 'Rollers' | 'BMX' | 'Skateboard';
  views: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  average_rating: number;
  user_liked: boolean;
  user_rating: number;
  profiles?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    telegram_username?: string;
    avatar_url?: string;
  };
}

interface LikeVideoParams {
  videoId: string;
  isLiked: boolean;
}

interface RateVideoParams {
  videoId: string;
  rating: number;
}

interface UploadVideoParams {
  title: string;
  description?: string;
  videoFile: File;
  category: 'Rollers' | 'BMX' | 'Skateboard';
  thumbnailBlob?: Blob;
  trimStart?: number;
  trimEnd?: number;
  onProgress?: (progress: number) => void;
}

export const useVideos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['videos', user?.id],
    queryFn: async () => {
      console.log('Загружаем видео для ленты с данными пользователей...');

      // Основной запрос видео с профилями пользователей
      const { data: videos, error } = await supabase
        .from('videos')
        .select(`
          *,
          profiles:user_id (
            username,
            first_name,
            last_name,
            telegram_username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки видео:', error);
        throw error;
      }

      console.log('Загружено видео:', videos?.length);

      if (!videos || videos.length === 0) {
        return [];
      }

      // Для каждого видео получаем статистику и взаимодействия пользователя
      const videosWithStats = await Promise.all(
        videos.map(async (video) => {
          try {
            // Подсчитываем лайки
            const { count: likesCount } = await supabase
              .from('video_likes')
              .select('*', { count: 'exact' })
              .eq('video_id', video.id);

            // Подсчитываем комментарии
            const { count: commentsCount } = await supabase
              .from('video_comments')
              .select('*', { count: 'exact' })
              .eq('video_id', video.id);

            // Считаем средний рейтинг
            const { data: ratings } = await supabase
              .from('video_ratings')
              .select('rating')
              .eq('video_id', video.id);

            const averageRating = ratings && ratings.length > 0
              ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
              : 0;

            // Проверяем взаимодействия текущего пользователя
            let userLiked = false;
            let userRating = 0;

            if (user?.id) {
              // Проверяем лайк пользователя
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
          } catch (error) {
            console.warn(`Ошибка загрузки статистики для видео ${video.id}:`, error);
            return {
              ...video,
              likes_count: 0,
              comments_count: 0,
              average_rating: 0,
              user_liked: false,
              user_rating: 0,
            };
          }
        })
      );

      console.log('Видео с обновленной статистикой:', videosWithStats);
      return videosWithStats;
    },
  });
};

export const useVideo = (id: string) => {
  return useQuery({
    queryKey: ['videos', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
  });
};

export const useLikeVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ videoId, isLiked }: LikeVideoParams) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      if (isLiked) {
        // Unlike the video
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) {
          throw new Error(error.message);
        }
      } else {
        // Like the video
        const { error } = await supabase
          .from('video_likes')
          .insert({ video_id: videoId, user_id: user.id });

        if (error) {
          throw new Error(error.message);
        }
      }
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['videos', videoId] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['video-feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      console.error('Ошибка мутации лайка:', error);
    },
  });
};

export const useRateVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ videoId, rating }: RateVideoParams) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      // Upsert the rating
      const { error } = await supabase
        .from('video_ratings')
        .upsert({ video_id: videoId, user_id: user.id, rating: rating }, { onConflict: 'video_id,user_id' });

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['videos', videoId] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['video-feed'] });
    },
    onError: (error) => {
      console.error('Ошибка мутации рейтинга:', error);
    },
  });
};

export const useUploadVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: UploadVideoParams) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      const { title, description, videoFile, category, thumbnailBlob, trimStart, trimEnd, onProgress } = params;
      
      console.log('Начинаем загрузку видео в оригинальном качестве:', {
        userId: user.id,
        title,
        category,
        originalSize: `${(videoFile.size / 1024 / 1024).toFixed(2)}MB`
      });

      onProgress?.(5);

      // Загружаем оригинальное видео без сжатия
      let finalVideoFile = videoFile;
      let finalThumbnailBlob = thumbnailBlob;
      
      // Создаем превью если не предоставлено
      if (!finalThumbnailBlob) {
        try {
          console.log('Генерируем превью...');
          finalThumbnailBlob = await generateQuickThumbnail(videoFile);
        } catch (error) {
          console.warn('Не удалось создать превью:', error);
        }
      }

      onProgress?.(20);

      // Сохраняем оригинальное расширение файла
      const fileExtension = videoFile.name.split('.').pop() || 'mp4';
      const videoFileName = `${user.id}/${Date.now()}_original.${fileExtension}`;
      
      try {
        console.log('Загружаем оригинальное видео...');
        const { data: videoUpload, error: videoError } = await supabase.storage
          .from('videos')
          .upload(videoFileName, finalVideoFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (videoError) {
          throw new Error(`Ошибка загрузки видео: ${videoError.message}`);
        }

        onProgress?.(60);

        const { data: videoUrlData } = supabase.storage
          .from('videos')
          .getPublicUrl(videoFileName);
          
        const videoUrl = videoUrlData.publicUrl;

        // Загружаем превью если есть
        let thumbnailUrl = null;
        if (finalThumbnailBlob) {
          console.log('Загружаем превью...');
          const thumbnailFileName = `${user.id}/${Date.now()}_thumb.jpg`;
          const { data: thumbnailUpload, error: thumbnailError } = await supabase.storage
            .from('videos')
            .upload(thumbnailFileName, finalThumbnailBlob, {
              cacheControl: '3600',
              upsert: false,
            });

          if (!thumbnailError) {
            const { data: thumbnailUrlData } = supabase.storage
              .from('videos')
              .getPublicUrl(thumbnailFileName);
            thumbnailUrl = thumbnailUrlData.publicUrl;
          }
        }

        onProgress?.(80);

        console.log('Сохраняем в базу данных...');
        const { data: videoRecord, error: dbError } = await supabase
          .from('videos')
          .insert({
            title,
            description,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            user_id: user.id,
            category,
            views: 0,
            likes_count: 0,
            comments_count: 0,
          })
          .select()
          .single();

        if (dbError) {
          throw new Error(`Ошибка сохранения: ${dbError.message}`);
        }

        onProgress?.(100);

        console.log('Загрузка видео завершена успешно - баллы начислены автоматически через триггеры');
        return videoRecord;
      } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        
        // Очищаем файлы при ошибке
        try {
          await supabase.storage.from('videos').remove([videoFileName]);
        } catch (cleanupError) {
          console.warn('Ошибка очистки файлов:', cleanupError);
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      // Инвалидируем все связанные кэши для мгновенного обновления
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['video-feed'] });
    },
    onError: (error) => {
      console.error('Ошибка мутации загрузки:', error);
    },
  });
};
