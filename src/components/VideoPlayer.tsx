import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVideoViews } from '@/hooks/useVideoViews';
import { useVideoPlayback } from '@/contexts/VideoPlaybackContext';

interface VideoPlayerProps {
  src: string;
  thumbnail: string;
  title: string;
  className?: string;
  videoId?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, thumbnail, title, className = '', videoId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasViewBeenCounted, setHasViewBeenCounted] = useState(false);
  const [isActivated, setIsActivated] = useState(false); // Загружался ли источник по клику
  const videoRef = useRef<HTMLVideoElement>(null);
  const { markVideoAsViewed } = useVideoViews();
  const { currentPlayingVideo, setCurrentPlayingVideo, videoToPreload } = useVideoPlayback();

  const shouldPreload = videoId === videoToPreload;
  const shouldLoadSource = isActivated || shouldPreload;

  // Эффект для автоматического воспроизведения после активации
  useEffect(() => {
    if (isActivated && videoRef.current && !isPlaying) {
      // Даем браузеру небольшой таймаут, чтобы он успел обработать новый src
      setTimeout(() => {
        videoRef.current?.play().catch(e => console.error(`Автовоспроизведение ${videoId} не удалось:`, e));
      }, 50);
    }
  }, [isActivated, videoId]);

  // Останавливаем видео если играет другое видео
  useEffect(() => {
    if (currentPlayingVideo && currentPlayingVideo !== videoId && isPlaying) {
      console.log(`Останавливаем видео ${videoId}, играет ${currentPlayingVideo}`);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [currentPlayingVideo, videoId, isPlaying]);

  // Пауза, если контекст был очищен (например, при открытии модального окна)
  useEffect(() => {
    if (currentPlayingVideo === null && isPlaying && videoRef.current) {
      console.log(`▶️⏸️ Контекст проигрываемого видео очищен, ставим на паузу ${videoId}`);
      videoRef.current.pause();
    }
  }, [currentPlayingVideo, isPlaying, videoId]);

  const handleVideoView = async () => {
    // Засчитываем просмотр только один раз при первом воспроизведении
    if (videoId && !hasViewBeenCounted) {
      console.log('🎬 Первое воспроизведение видео, засчитываем просмотр:', videoId);
      try {
        await markVideoAsViewed(videoId);
        setHasViewBeenCounted(true);
        console.log('✅ Просмотр засчитан для видео:', videoId);
      } catch (error) {
        console.error('❌ Ошибка при засчитывании просмотра:', error);
      }
    }
  };

  const togglePlay = () => {
    if (!isActivated) {
      console.log(`▶️ Первая активация видео ${videoId}`);
      setIsActivated(true);
      return; // Эффект позаботится о воспроизведении
    }

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      // isPlaying обновится через onPlay/onPause события
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleVideoClick = () => {
    togglePlay();
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    if(videoId === currentPlayingVideo) {
      setCurrentPlayingVideo(null);
    }
  };

  const handleMouseEnter = () => {
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  const handleVideoPlayEvent = () => {
    setIsPlaying(true);
    if (videoId) {
      setCurrentPlayingVideo(videoId);
    }
    handleVideoView();
  };

  const handleVideoPauseEvent = () => {
    setIsPlaying(false);
    // Сбрасываем currentPlayingVideo только если это было текущее видео
    if(videoId === currentPlayingVideo) {
      setCurrentPlayingVideo(null);
    }
  };

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={shouldLoadSource ? src : undefined}
        poster={thumbnail}
        className="w-full h-full object-contain cursor-pointer"
        onClick={handleVideoClick}
        onEnded={handleVideoEnd}
        onPlay={handleVideoPlayEvent}
        onPause={handleVideoPauseEvent}
        playsInline
        preload={shouldPreload ? "auto" : "none"}
      />
      
      {/* Центральная кнопка воспроизведения */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <Button
            size="lg"
            className="bg-white bg-opacity-80 hover:bg-opacity-100 text-black rounded-full w-16 h-16"
            onClick={togglePlay}
          >
            <Play className="w-8 h-8 ml-1" />
          </Button>
        </div>
      )}

      {/* Панель управления */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
