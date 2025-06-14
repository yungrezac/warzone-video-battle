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
  user_liked: boolean;
  profiles?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    telegram_username?: string;
    avatar_url?: string;
  };
  is_winner?: boolean; 
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

  return useQuery<Video[], Error>({
    queryKey: ['videos', user?.id],
    queryFn: async () => {
      console.log('📹 Загружаем видео для ленты (без рейтинга)...');

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

      console.log('✅ Загружено видео (начальное количество):', videos?.length);

      if (!videos || videos.length === 0) {
        return [];
      }

      const videosWithStats = await Promise.all(
        videos.map(async (video) => {
          try {
            let userLiked = false;

            if (user?.id) {
              const { data: userLikeData } = await supabase
                .from('video_likes')
                .select('*')
                .eq('video_id', video.id)
                .eq('user_id', user.id)
                .maybeSingle();
              userLiked = !!userLikeData;
            }

            const { count: totalLikes, error: likesError } = await supabase
              .from('video_likes')
              .select('*', { count: 'exact', head: true })
              .eq('video_id', video.id);

            if (likesError) {
              console.warn(`⚠️ Ошибка загрузки общего количества лайков для видео ${video.id}:`, likesError);
            }
            
            const { count: totalComments, error: commentsError } = await supabase
              .from('video_comments')
              .select('*', { count: 'exact', head: true })
              .eq('video_id', video.id);

            if (commentsError) {
              console.warn(`⚠️ Ошибка загрузки общего количества комментариев для видео ${video.id}:`, commentsError);
            }

            return {
              ...video,
              likes_count: totalLikes || video.likes_count || 0,
              comments_count: totalComments || video.comments_count || 0,
              user_liked: userLiked,
            } as Video;
          } catch (statError) {
            console.warn(`⚠️ Ошибка загрузки статистики для видео ${video.id} (без рейтинга):`, statError);
            return {
              ...video,
              user_liked: false,
            } as Video;
          }
        })
      );

      console.log('✅ Видео с обновленной статистикой (без рейтинга) загружены');
      return videosWithStats;
    },
  });
};

export const useVideo = (id: string) => {
  return useQuery<Video, Error>({
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
      return data as Video;
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
        
        try {
          await supabase.storage.from('videos').remove([videoFileName]);
        } catch (cleanupError) {
          console.warn('Ошибка очистки файлов:', cleanupError);
        }
        
        throw error;
      }
    },
    onSuccess: () => {
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
