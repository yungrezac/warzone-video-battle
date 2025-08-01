
// Утилиты для работы с видео (оптимизированные для лучшей загрузки)
export const compressVideo = async (file: File, quality: number = 0.8): Promise<File> => {
  // Возвращаем оригинальный файл без сжатия
  console.log('🎥 Загружаем видео в оригинальном качестве');
  return file;
};

export const shouldCompress = (file: File): boolean => {
  // Отключаем автоматическое сжатие
  return false;
};

export const getOptimalChunkSize = (fileSize: number): number => {
  // Увеличиваем размер чанков для быстрой загрузки больших файлов
  if (fileSize < 10 * 1024 * 1024) return 1024 * 1024;  // 1MB
  if (fileSize < 50 * 1024 * 1024) return 2 * 1024 * 1024; // 2MB
  return 4 * 1024 * 1024; // 4MB для очень больших файлов
};

// Функция для предзагрузки видео
export const preloadVideo = (src: string): Promise<HTMLVideoElement> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    
    const onCanPlay = () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      resolve(video);
    };
    
    const onError = () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      reject(new Error('Не удалось предзагрузить видео'));
    };
    
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    video.src = src;
    
    // Таймаут для предзагрузки
    setTimeout(() => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      reject(new Error('Таймаут предзагрузки видео'));
    }, 10000);
  });
};

// Функция для создания превью с улучшенной обработкой ошибок
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
    
    let hasResolved = false;
    
    video.onloadedmetadata = () => {
      // Получаем кадр из начала видео
      video.currentTime = Math.min(0.5, video.duration * 0.1);
    };
    
    video.onseeked = () => {
      if (hasResolved) return;
      
      try {
        // Сохраняем оригинальные пропорции
        const maxWidth = 480;
        const maxHeight = 360;
        
        let { videoWidth, videoHeight } = video;
        
        // Проверяем валидность размеров
        if (!videoWidth || !videoHeight) {
          videoWidth = maxWidth;
          videoHeight = maxHeight;
        }
        
        const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
        
        canvas.width = Math.floor(videoWidth * ratio);
        canvas.height = Math.floor(videoHeight * ratio);
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob && !hasResolved) {
            hasResolved = true;
            resolve(blob);
          } else if (!hasResolved) {
            hasResolved = true;
            reject(new Error('Не удалось создать превью'));
          }
        }, 'image/jpeg', 0.8);
      } catch (error) {
        if (!hasResolved) {
          hasResolved = true;
          reject(error);
        }
      }
    };
    
    video.onerror = (error) => {
      if (!hasResolved) {
        hasResolved = true;
        reject(new Error('Ошибка загрузки видео для создания превью'));
      }
    };
    
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    
    video.onloadstart = () => {
      URL.revokeObjectURL(videoUrl);
    };
    
    // Таймаут для создания превью
    setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        reject(new Error('Таймаут создания превью'));
      }
    }, 15000);
  });
};
