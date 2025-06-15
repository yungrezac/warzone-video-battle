import compress from 'browser-video-compression';

const COMPRESSION_OPTIONS = {
  maxSizeMB: 5,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  maxIteration: 10,
  onProgress: (progress: number) => {
    console.log(`Compression progress: ${(progress * 100).toFixed(0)}%`);
  },
};

// Утилиты для работы с видео
export const compressVideo = async (file: File): Promise<File> => {
  console.log(`🎥 Начинаем сжатие видео: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  try {
    const compressedFile = await compress(file, COMPRESSION_OPTIONS);
    console.log(`✅ Сжатие завершено. Новый размер: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    return compressedFile;
  } catch (error) {
    console.error('❌ Ошибка сжатия видео, будет загружен оригинал:', error);
    // В случае ошибки возвращаем оригинальный файл
    return file;
  }
};

export const shouldCompress = (file: File): boolean => {
  // Сжимаем видео больше 10 МБ
  const MAX_UNCOMPRESSED_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
  const should = file.size > MAX_UNCOMPRESSED_SIZE_BYTES;
  console.log(`🤔 Проверка необходимости сжатия: ${should ? 'Да' : 'Нет'}. Размер: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  return should;
};

export const getOptimalChunkSize = (fileSize: number): number => {
  // Увеличиваем размер чанков для быстрой загрузки больших файлов
  if (fileSize < 10 * 1024 * 1024) return 1024 * 1024;  // 1MB
  if (fileSize < 50 * 1024 * 1024) return 2 * 1024 * 1024; // 2MB
  return 4 * 1024 * 1024; // 4MB для очень больших файлов
};

// Функция для создания превью остается без изменений
export const generateQuickThumbnail = (videoFile: File): Promise<Blob> => {
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
      // Получаем кадр из начала видео
      video.currentTime = 0.1;
    };
    
    video.onseeked = () => {
      try {
        // Сохраняем оригинальные пропорции
        const maxWidth = 480;
        const maxHeight = 360;
        
        let { videoWidth, videoHeight } = video;
        const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
        
        canvas.width = Math.floor(videoWidth * ratio);
        canvas.height = Math.floor(videoHeight * ratio);
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
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
      reject(new Error('Ошибка загрузки видео для создания превью'));
    };
    
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    
    video.onloadstart = () => {
      URL.revokeObjectURL(videoUrl);
    };
    
    // Таймаут для создания превью
    setTimeout(() => {
      reject(new Error('Таймаут создания превью'));
    }, 10000);
  });
};
