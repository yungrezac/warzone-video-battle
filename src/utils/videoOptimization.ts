
// Утилиты для максимальной оптимизации видео перед загрузкой
export const compressVideo = async (file: File, quality: number = 0.6): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Не удалось создать canvas context'));
      return;
    }

    video.onloadedmetadata = () => {
      // Более агрессивное уменьшение разрешения для быстрой загрузки
      const maxWidth = 854;  // 480p width
      const maxHeight = 480; // 480p height
      
      let { videoWidth, videoHeight } = video;
      
      // Всегда уменьшаем разрешение для экстремального ускорения
      const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
      videoWidth = Math.floor(videoWidth * ratio);
      videoHeight = Math.floor(videoHeight * ratio);
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Создаем MediaRecorder с максимальным сжатием
      const stream = canvas.captureStream(20); // Снижаем FPS до 20
      
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: Math.min(500000, Math.floor(file.size / video.duration * quality)) // Максимум 500kbps
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
        const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.webm'), {
          type: 'video/webm'
        });
        console.log(`🗜️ Сжатие завершено: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        resolve(compressedFile);
      };
      
      mediaRecorder.onerror = () => {
        reject(new Error('Ошибка сжатия видео'));
      };
      
      // Начинаем запись
      mediaRecorder.start(100); // Чанки по 100мс
      
      // Быстрое проигрывание для ускорения сжатия
      video.playbackRate = 2.0;
      video.currentTime = 0;
      video.play();
      
      const drawFrame = () => {
        if (!video.ended && !video.paused) {
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
          requestAnimationFrame(drawFrame);
        } else {
          setTimeout(() => mediaRecorder.stop(), 100);
        }
      };
      
      video.onplay = () => {
        drawFrame();
      };
      
      // Таймаут безопасности
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 30000);
    };
    
    video.onerror = () => {
      reject(new Error('Ошибка загрузки видео для сжатия'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const shouldCompress = (file: File): boolean => {
  // Сжимаем все файлы больше 5MB для максимальной скорости
  return file.size > 5 * 1024 * 1024;
};

export const getOptimalChunkSize = (fileSize: number): number => {
  // Более крупные чанки для быстрой загрузки
  if (fileSize < 2 * 1024 * 1024) return 512 * 1024;  // 512KB
  if (fileSize < 10 * 1024 * 1024) return 1024 * 1024; // 1MB
  return 2 * 1024 * 1024; // 2MB для больших файлов
};

// Новая функция для быстрого создания превью
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
      // Быстрое получение кадра из начала видео
      video.currentTime = 0.1; // Берем кадр с 0.1 секунды
    };
    
    video.onseeked = () => {
      try {
        // Небольшое разрешение для быстрого создания
        const maxWidth = 320;
        const maxHeight = 240;
        
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
        }, 'image/jpeg', 0.7); // Умеренное качество для скорости
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
    
    // Таймаут для быстрого фейла
    setTimeout(() => {
      reject(new Error('Таймаут создания превью'));
    }, 5000);
  });
};
