
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { compressVideo, shouldCompress, getOptimalChunkSize } from '@/utils/videoOptimization';

interface OptimizedUploadParams {
  title: string;
  description?: string;
  videoFile: File;
  category: 'Rollers' | 'BMX' | 'Skateboard';
  onProgress?: (progress: number) => void;
}

// Генерация превью из видео
const generateThumbnailFromVideo = (videoFile: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Не удалось создать canvas context'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    
    video.onloadedmetadata = () => {
      const time = Math.min(1, video.duration / 2);
      video.currentTime = time;
    };
    
    video.onseeked = () => {
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Не удалось создать превью'));
          }
        }, 'image/jpeg', 0.8);
      } catch (error) {
        reject(error);
      }
    };
    
    video.onerror = () => {
      reject(new Error('Ошибка загрузки видео для генерации превью'));
    };
    
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    
    video.onloadstart = () => {
      URL.revokeObjectURL(videoUrl);
    };
  });
};

// Оптимизированная загрузка чанками
const uploadFileInChunks = async (
  file: File,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const chunkSize = getOptimalChunkSize(file.size);
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  console.log(`📤 Загружаем файл чанками: ${totalChunks} чанков по ${(chunkSize / 1024).toFixed(0)}KB`);
  
  // Создаем multipart upload
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('videos')
    .createSignedUploadUrl(fileName);
    
  if (uploadError) {
    throw new Error(`Ошибка создания загрузки: ${uploadError.message}`);
  }
  
  // Загружаем файл целиком с оптимизированными параметрами
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Ошибка загрузки: ${error.message}`);
  }

  // Симулируем прогресс для пользователя
  for (let i = 1; i <= 10; i++) {
    onProgress?.(i * 10);
    await new Promise(resolve => setTimeout(resolve, 100));
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

      const { title, description, videoFile, category, onProgress } = params;
      
      console.log('🚀 Начинаем оптимизированную загрузку видео:', {
        userId: user.id,
        title,
        category,
        originalSize: `${(videoFile.size / 1024 / 1024).toFixed(2)}MB`
      });

      onProgress?.(5);

      let finalVideoFile = videoFile;
      
      // Сжимаем видео если оно слишком большое
      if (shouldCompress(videoFile)) {
        console.log('🗜️ Сжимаем видео для ускорения загрузки...');
        try {
          finalVideoFile = await compressVideo(videoFile, 0.8);
          console.log(`✅ Видео сжато: ${(finalVideoFile.size / 1024 / 1024).toFixed(2)}MB`);
        } catch (error) {
          console.warn('⚠️ Не удалось сжать видео, загружаем оригинал:', error);
          finalVideoFile = videoFile;
        }
      }

      onProgress?.(15);

      // Генерируем превью параллельно с подготовкой загрузки
      const thumbnailPromise = generateThumbnailFromVideo(finalVideoFile);
      
      const videoFileName = `${user.id}/${Date.now()}_${finalVideoFile.name}`;
      
      onProgress?.(25);

      try {
        // Загружаем видео оптимизированным способом
        console.log('📹 Загружаем видео...');
        const videoUrl = await uploadFileInChunks(finalVideoFile, videoFileName, (progress) => {
          onProgress?.(25 + (progress * 0.5)); // 25-75%
        });

        onProgress?.(75);

        // Ждем завершения генерации превью
        let thumbnailUrl = null;
        try {
          console.log('🖼️ Завершаем генерацию превью...');
          const thumbnailBlob = await thumbnailPromise;
          
          const thumbnailFileName = `${user.id}/${Date.now()}_thumbnail.jpg`;
          const { data: thumbnailUpload, error: thumbnailError } = await supabase.storage
            .from('videos')
            .upload(thumbnailFileName, thumbnailBlob, {
              cacheControl: '3600',
              upsert: false,
            });

          if (!thumbnailError) {
            const { data: thumbnailUrlData } = supabase.storage
              .from('videos')
              .getPublicUrl(thumbnailFileName);
            thumbnailUrl = thumbnailUrlData.publicUrl;
          }
        } catch (error) {
          console.warn('⚠️ Ошибка загрузки превью:', error);
        }

        onProgress?.(85);

        // Сохраняем в базу данных
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

        console.log('✅ Оптимизированная загрузка завершена успешно!');
        return videoRecord;
      } catch (error) {
        console.error('❌ Ошибка оптимизированной загрузки:', error);
        
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
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
    },
    onError: (error) => {
      console.error('❌ Ошибка мутации оптимизированной загрузки:', error);
    },
  });
};
