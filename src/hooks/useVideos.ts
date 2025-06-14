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
  is_winner?: boolean;
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
      console.log('📹 Загружаем видео для ленты...');

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
        console.error('❌ Ошибка загрузки видео:', error);
        throw error;
      }

      console.log('✅ Загружено видео:', videos?.length);

      if (!videos || videos.length === 0) {
        return [];
      }

      // Получаем актуальные счетчики лайков для каждого видео
      const { data: likesData, error: likesError } = await supabase
        .from('video_likes')
        .select('video_id')
        .in('video_id', videos.map(v => v.id));

      if (likesError) {
        console.error('❌ Ошибка загрузки лайков:', likesError);
      }

      // Подсчитываем лайки для каждого видео
      const likesCounts: { [key: string]: number } = {};
      if (likesData) {
        likesData.forEach(like => {
          likesCounts[like.video_id] = (likesCounts[like.video_id] || 0) + 1;
        });
      }

      console.log('📊 Подсчитанные лайки:', likesCounts);

      // Получаем взаимодействия пользователя для всех видео одним запросом
      let userLikes: { [key: string]: boolean } = {};
      let userRatings: { [key: string]: number } = {};

      if (user?.id) {
        // Получаем все лайки пользователя одним запросом
        const { data: userLikesData } = await supabase
          .from('video_likes')
          .select('video_id')
          .eq('user_id', user.id)
          .in('video_id', videos.map(v => v.id));

        // Создаем объект для быстрого поиска
        userLikes = (userLikesData || []).reduce((acc, like) => {
          acc[like.video_id] = true;
          return acc;
        }, {} as { [key: string]: boolean });

        // Получаем все рейтинги пользователя одним запросом
        const { data: ratingsData } = await supabase
          .from('video_ratings')
          .select('video_id, rating')
          .eq('user_id', user.id)
          .in('video_id', videos.map(v => v.id));

        // Создаем объект для быстрого поиска
        userRatings = (ratingsData || []).reduce((acc, rating) => {
          acc[rating.video_id] = rating.rating;
          return acc;
        }, {} as { [key: string]: number });
      }

      // Получаем средние рейтинги для всех видео одним запросом
      const { data: allRatings } = await supabase
        .from('video_ratings')
        .select('video_id, rating')
        .in('video_id', videos.map(v => v.id));

      // Вычисляем средние рейтинги
      const averageRatings: { [key: string]: number } = {};
      if (allRatings) {
        const ratingsByVideo = allRatings.reduce((acc, rating) => {
          if (!acc[rating.video_id]) {
            acc[rating.video_id] = [];
          }
          acc[rating.video_id].push(rating.rating);
          return acc;
        }, {} as { [key: string]: number[] });

        Object.keys(ratingsByVideo).forEach(videoId => {
          const ratings = ratingsByVideo[videoId];
          averageRatings[videoId] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        });
      }

      // Объединяем все данные
      const videosWithStats = videos.map(video => {
        const actualLikesCount = likesCounts[video.id] || 0;
        console.log(`🎬 Видео ${video.id}: лайков в БД = ${actualLikesCount}, в таблице = ${video.likes_count}`);
        
        return {
          ...video,
          user_liked: userLikes[video.id] || false,
          user_rating: userRatings[video.id] || 0,
          average_rating: Number((averageRatings[video.id] || 0).toFixed(1)),
          // Используем актуальный подсчет лайков вместо cached значения
          likes_count: actualLikesCount,
          comments_count: video.comments_count || 0,
        };
      });

      console.log('✅ Видео с обновленной статистикой загружены');
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

export const useRateVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ videoId, rating }: RateVideoParams) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      console.log('⭐ Оцениваем видео:', { videoId, rating });

      // Upsert the rating
      const { error } = await supabase
        .from('video_ratings')
        .upsert({ video_id: videoId, user_id: user.id, rating: rating }, { onConflict: 'video_id,user_id' });

      if (error) {
        console.error('Ошибка рейтинга:', error);
        throw new Error(error.message);
      }

      console.log('✅ Рейтинг успешно поставлен');
    },
    onSuccess: (_, { videoId }) => {
      console.log('✅ useRateVideo успешно, инвалидируем кэш...');
      queryClient.invalidateQueries({ queryKey: ['videos', videoId] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['video-feed'] });
    },
    onError: (error) => {
      console.error('❌ Ошибка мутации рейтинга:', error);
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
