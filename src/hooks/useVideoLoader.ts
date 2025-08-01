
import { useState, useEffect, useRef } from 'react';

interface UseVideoLoaderProps {
  src: string;
  preload?: 'none' | 'metadata' | 'auto';
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: (error: any) => void;
}

export const useVideoLoader = ({ 
  src, 
  preload = 'metadata',
  onLoadStart,
  onCanPlay,
  onError
}: UseVideoLoaderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const handleLoadStart = () => {
    console.log('🎥 Начинаем загрузку видео:', src);
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  };

  const handleLoadedMetadata = () => {
    console.log('📊 Метаданные видео загружены:', src);
    setLoadProgress(30);
  };

  const handleCanPlay = () => {
    console.log('✅ Видео готово к воспроизведению:', src);
    setIsLoading(false);
    setCanPlay(true);
    setLoadProgress(100);
    onCanPlay?.();
  };

  const handleProgress = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const duration = video.duration;
      if (duration > 0) {
        const progress = Math.min((bufferedEnd / duration) * 100, 90);
        setLoadProgress(progress);
      }
    }
  };

  const handleError = (error: any) => {
    console.error('❌ Ошибка загрузки видео:', src, error);
    setHasError(true);
    setIsLoading(false);
    
    // Попытка перезагрузки
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current++;
      console.log(`🔄 Попытка перезагрузки ${retryCountRef.current}/${maxRetries}:`, src);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 1000 * retryCountRef.current); // Увеличиваем задержку с каждой попыткой
    } else {
      onError?.(error);
    }
  };

  const handleStalled = () => {
    console.warn('⏳ Видео застопорилось при загрузке:', src);
    // Попробуем перезагрузить, если видео застопорилось
    if (videoRef.current && retryCountRef.current < maxRetries) {
      setTimeout(() => {
        videoRef.current?.load();
      }, 2000);
    }
  };

  const retryLoad = () => {
    if (videoRef.current) {
      retryCountRef.current = 0;
      setHasError(false);
      setIsLoading(true);
      setCanPlay(false);
      setLoadProgress(0);
      videoRef.current.load();
    }
  };

  // Настройка слушателей событий
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('error', handleError);
    video.addEventListener('stalled', handleStalled);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('error', handleError);
      video.removeEventListener('stalled', handleStalled);
    };
  }, [src]);

  return {
    videoRef,
    isLoading,
    hasError,
    canPlay,
    loadProgress,
    retryLoad
  };
};
