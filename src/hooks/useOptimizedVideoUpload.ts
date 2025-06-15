import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { generateQuickThumbnail } from '@/utils/videoOptimization';

interface OptimizedUploadParams {
  title: string;
  description?: string;
  videoFile: File;
  category: 'Rollers' | 'BMX' | 'Skateboard';
  thumbnailBlob?: Blob;
  onProgress?: (progress: number) => void;
}

// Загрузка оригинального видео без сжатия
const uploadOriginalVideo = async (
  file: File,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log(`📹 Загружаем оригинальное видео: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  
  // Прямая загрузка оригинального файла
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Ошибка загрузки: ${error.message}`);
  }

  // Симуляция прогресса
  if (onProgress) {
    for (let i = 10; i <= 100; i += 20) {
      onProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const { data: urlData } = supabase.storage
    .from('videos')
    .getPublicUrl(fileName);
    
  return urlData.publicUrl;
};

export const useOptimizedVideoUpload = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: OptimizedUploadParams) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      const { title, description, videoFile, category, thumbnailBlob, onProgress } = params;
      
      console.log('📹 Загружаем оригинальное видео:', {
        userId: user.id,
        title,
        category,
        originalSize: `${(videoFile.size / 1024 / 1024).toFixed(2)}MB`
      });

      onProgress?.(2);

      // Загружаем оригинальное видео
      let finalVideoFile = videoFile;
      let thumbnailPromise: Promise<Blob | null>;
      
      // Используем переданный thumbnailBlob или генерируем новый
      if (thumbnailBlob) {
        thumbnailPromise = Promise.resolve(thumbnailBlob);
      } else {
        console.log('🖼️ Создаем превью...');
        thumbnailPromise = generateQuickThumbnail(videoFile).catch(() => null);
      }

      onProgress?.(15);

      // Сохраняем оригинальное расширение
      const fileExtension = videoFile.name.split('.').pop() || 'mp4';
      const videoFileName = `${user.id}/${Date.now()}_original.${fileExtension}`;
      
      try {
        // Загружаем оригинальное видео
        console.log('📹 Загружаем оригинальное видео...');
        const videoUrl = await uploadOriginalVideo(finalVideoFile, videoFileName, (progress) => {
          onProgress?.(15 + (progress * 0.6)); // 15-75%
        });

        onProgress?.(75);

        // Обрабатываем превью
        let thumbnailUrl = null;
        try {
          const thumbnailBlobResult = await thumbnailPromise;
          if (thumbnailBlobResult) {
            console.log('🖼️ Загружаем превью...');
            const thumbnailFileName = `${user.id}/${Date.now()}_thumb.jpg`;
            const { data: thumbnailUpload, error: thumbnailError } = await supabase.storage
              .from('videos')
              .upload(thumbnailFileName, thumbnailBlobResult, {
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
        } catch (error) {
          console.warn('⚠️ Ошибка загрузки превью (не критично):', error);
        }

        onProgress?.(85);

        // Сохраняем в БД
        console.log('💾 Сохраняем в базу данных...');
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

        onProgress?.(95);

        // Асинхронно отправляем уведомления подписчикам
        supabase.functions.invoke('notify-followers', {
          body: { videoId: videoRecord.id }
        }).then(() => {
          console.log(`🚀 Запущены уведомления подписчикам для видео ${videoRecord.id}`);
        }).catch(err => {
          console.error(`❌ Ошибка запуска уведомлений для видео ${videoRecord.id}:`, err);
        });

        // Асинхронно обновляем достижения
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

        console.log('🎉 Загрузка оригинального видео завершена!');
        return videoRecord;
      } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        
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
      console.error('❌ Ошибка мутации загрузки:', error);
    },
  });
};
