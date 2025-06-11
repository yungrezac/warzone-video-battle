
// Утилиты для оптимизации видео перед загрузкой
export const compressVideo = (file: File, quality: number = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Не удалось создать canvas context'));
      return;
    }

    video.onloadedmetadata = () => {
      // Уменьшаем разрешение для ускорения загрузки
      const maxWidth = 1280;
      const maxHeight = 720;
      
      let { videoWidth, videoHeight } = video;
      
      if (videoWidth > maxWidth || videoHeight > maxHeight) {
        const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
        videoWidth = Math.floor(videoWidth * ratio);
        videoHeight = Math.floor(videoHeight * ratio);
      }
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Создаем MediaRecorder для сжатия
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: Math.floor(file.size / video.duration * quality)
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
        resolve(compressedFile);
      };
      
      // Начинаем запись
      mediaRecorder.start();
      
      // Проигрываем видео для записи
      video.currentTime = 0;
      video.play();
      
      const drawFrame = () => {
        if (!video.ended && !video.paused) {
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
          requestAnimationFrame(drawFrame);
        } else {
          mediaRecorder.stop();
        }
      };
      
      video.onplay = () => {
        drawFrame();
      };
    };
    
    video.onerror = () => {
      reject(new Error('Ошибка загрузки видео для сжатия'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const shouldCompress = (file: File): boolean => {
  // Сжимаем файлы больше 10MB
  return file.size > 10 * 1024 * 1024;
};

export const getOptimalChunkSize = (fileSize: number): number => {
  // Определяем оптимальный размер чанка для загрузки
  if (fileSize < 5 * 1024 * 1024) return 256 * 1024; // 256KB для маленьких файлов
  if (fileSize < 20 * 1024 * 1024) return 512 * 1024; // 512KB для средних файлов
  return 1024 * 1024; // 1MB для больших файлов
};
