
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { compressVideo, shouldCompress, generateQuickThumbnail } from '@/utils/videoOptimization';

interface OptimizedUploadParams {
  title: string;
  description?: string;
  videoFile: File;
  category: 'Rollers' | 'BMX' | 'Skateboard';
  onProgress?: (progress: number) => void;
}

// Ультрабыстрая загрузка с минимальными задержками
const uploadFileOptimized = async (
  file: File,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log(`⚡ Начинаем ультрабыструю загрузку: ${(file.size / 1024).toFixed(0)}KB`);
  
  // Прямая загрузка без лишних проверок
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Ошибка загрузки: ${error.message}`);
  }

  // Быстрая симуляция прогресса
  if (onProgress) {
    for (let i = 10; i <= 100; i += 15) {
      onProgress(i);
      await new Promise(resolve => setTimeout(resolve, 50));
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

      const { title, description, videoFile, category, onProgress } = params;
      
      console.log('⚡ Начинаем экстремально быструю загрузку:', {
        userId: user.id,
        title,
        category,
        originalSize: `${(videoFile.size / 1024 / 1024).toFixed(2)}MB`
      });

      onProgress?.(2);

      let finalVideoFile = videoFile;
      let thumbnailPromise: Promise<Blob | null> = Promise.resolve(null);
      
      // Параллельно запускаем сжатие и создание превью
      if (shouldCompress(videoFile)) {
        console.log('🚀 Сжимаем видео для ультра-скорости...');
        try {
          const [compressedFile, thumbnail] = await Promise.all([
            compressVideo(videoFile, 0.5), // Более агрессивное сжатие
            generateQuickThumbnail(videoFile).catch(() => null)
          ]);
          
          finalVideoFile = compressedFile;
          thumbnailPromise = Promise.resolve(thumbnail);
          console.log(`✅ Сжатие завершено: ${(finalVideoFile.size / 1024 / 1024).toFixed(2)}MB`);
        } catch (error) {
          console.warn('⚠️ Сжатие не удалось, загружаем оригинал:', error);
          // Генерируем превью без сжатия видео
          thumbnailPromise = generateQuickThumbnail(videoFile).catch(() => null);
        }
      } else {
        // Для небольших файлов только превью
        thumbnailPromise = generateQuickThumbnail(videoFile).catch(() => null);
      }

      onProgress?.(15);

      const videoFileName = `${user.id}/${Date.now()}_optimized.webm`;
      
      try {
        // Загружаем видео максимально быстро
        console.log('📹 Загружаем видео на максимальной скорости...');
        const videoUrl = await uploadFileOptimized(finalVideoFile, videoFileName, (progress) => {
          onProgress?.(15 + (progress * 0.6)); // 15-75%
        });

        onProgress?.(75);

        // Обрабатываем превью параллельно
        let thumbnailUrl = null;
        try {
          const thumbnailBlob = await thumbnailPromise;
          if (thumbnailBlob) {
            console.log('🖼️ Загружаем превью...');
            const thumbnailFileName = `${user.id}/${Date.now()}_thumb.jpg`;
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
          }
        } catch (error) {
          console.warn('⚠️ Ошибка загрузки превью (не критично):', error);
        }

        onProgress?.(85);

        // Быстро сохраняем в БД
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

        // Асинхронно обновляем достижения (не блокируем UI)
        supabase.rpc('update_achievement_progress', { 
          p_user_id: user.id,
          p_category: 'videos_uploaded',
          p_increment: 1
        }).catch(error => console.warn('Ошибка обновления достижений:', error));

        onProgress?.(100);

        console.log('🎉 Экстремально быстрая загрузка завершена!');
        return videoRecord;
      } catch (error) {
        console.error('❌ Ошибка быстрой загрузки:', error);
        
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
      console.error('❌ Ошибка мутации экстремальной загрузки:', error);
    },
  });
};
