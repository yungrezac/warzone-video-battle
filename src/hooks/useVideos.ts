import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { compressVideo, shouldCompress, generateQuickThumbnail } from '@/utils/videoOptimization';

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
  return useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
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
      
      console.log('Начинаем загрузку видео:', {
        userId: user.id,
        title,
        category,
        originalSize: `${(videoFile.size / 1024 / 1024).toFixed(2)}MB`
      });

      onProgress?.(5);

      let finalVideoFile = videoFile;
      let finalThumbnailBlob = thumbnailBlob;
      
      // Автоматически создаем превью если не предоставлено
      if (!finalThumbnailBlob) {
        try {
          console.log('Генерируем превью автоматически...');
          finalThumbnailBlob = await generateQuickThumbnail(videoFile);
        } catch (error) {
          console.warn('Не удалось создать превью:', error);
        }
      }

      // Сжимаем видео если нужно
      if (shouldCompress(videoFile)) {
        console.log('Сжимаем видео...');
        try {
          finalVideoFile = await compressVideo(videoFile, 0.7);
          console.log(`Сжатие завершено: ${(finalVideoFile.size / 1024 / 1024).toFixed(2)}MB`);
        } catch (error) {
          console.warn('Сжатие не удалось, загружаем оригинал:', error);
        }
      }

      onProgress?.(20);

      const videoFileName = `${user.id}/${Date.now()}_${finalVideoFile.name}`;
      
      try {
        console.log('Загружаем видео в хранилище...');
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

        onProgress?.(90);

        // Обновляем достижения
        try {
          await supabase.rpc('update_achievement_progress', { 
            p_user_id: user.id,
            p_category: 'videos_uploaded',
            p_increment: 1
          });
        } catch (error) {
          console.warn('Ошибка обновления достижений:', error);
        }

        onProgress?.(100);

        console.log('Загрузка видео завершена успешно');
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
