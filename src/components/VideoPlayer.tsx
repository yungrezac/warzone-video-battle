
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIncrementVideoViews } from '@/hooks/useVideoViews';
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
  const [hasIncrementedView, setHasIncrementedView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const incrementViewsMutation = useIncrementVideoViews();
  const { currentPlayingVideo, setCurrentPlayingVideo } = useVideoPlayback();

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

  const handleVideoPlay = () => {
    // Увеличиваем просмотры только один раз при первом воспроизведении
    if (videoId && !hasIncrementedView) {
      console.log('Первое воспроизведение видео, увеличиваем просмотры');
      incrementViewsMutation.mutate(videoId);
      setHasIncrementedView(true);
    }
  };

  const togglePlay = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setCurrentPlayingVideo(null);
      } else {
        setIsLoading(true);
        try {
          await videoRef.current.play();
          if (videoId) {
            setCurrentPlayingVideo(videoId);
          }
          handleVideoPlay();
        } catch (error) {
          console.error('Ошибка воспроизведения:', error);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      }
      setIsPlaying(!isPlaying);
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
    if (!hasError) {
      togglePlay();
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setCurrentPlayingVideo(null);
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
    setIsLoading(false);
    setIsBuffering(false);
    if (videoId) {
      setCurrentPlayingVideo(videoId);
    }
    handleVideoPlay();
  };

  const handleVideoPauseEvent = () => {
    setIsPlaying(false);
    setCurrentPlayingVideo(null);
  };

  const handleLoadStart = () => {
    console.log('Начинаем загрузку видео:', src);
    setIsLoading(true);
    setHasError(false);
  };

  const handleCanPlay = () => {
    console.log('Видео готово к воспроизведению:', src);
    setCanPlay(true);
    setIsLoading(false);
  };

  const handleWaiting = () => {
    console.log('Видео буферизуется:', src);
    setIsBuffering(true);
  };

  const handleCanPlayThrough = () => {
    console.log('Видео полностью загружено:', src);
    setIsBuffering(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Ошибка загрузки видео:', e);
    setHasError(true);
    setIsLoading(false);
    setIsBuffering(false);
  };

  const handleLoadedMetadata = () => {
    console.log('Метаданные видео загружены:', src);
  };

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail}
        className="w-full h-full object-contain cursor-pointer"
        onClick={handleVideoClick}
        onEnded={handleVideoEnd}
        onPlay={handleVideoPlayEvent}
        onPause={handleVideoPauseEvent}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onCanPlayThrough={handleCanPlayThrough}
        onWaiting={handleWaiting}
        onError={handleError}
        onLoadedMetadata={handleLoadedMetadata}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      {/* Индикатор ошибки */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-center text-white">
            <p className="text-sm mb-2">Ошибка загрузки видео</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setHasError(false);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="text-white border-white hover:bg-white hover:text-black"
            >
              Попробовать снова
            </Button>
          </div>
        </div>
      )}

      {/* Индикатор загрузки/буферизации */}
      {(isLoading || isBuffering) && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-xs">
              {isLoading ? 'Загрузка...' : 'Буферизация...'}
            </p>
          </div>
        </div>
      )}

      {/* Центральная кнопка воспроизведения */}
      {!isPlaying && !isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <Button
            size="lg"
            className="bg-white bg-opacity-80 hover:bg-opacity-100 text-black rounded-full w-16 h-16"
            onClick={togglePlay}
            disabled={!canPlay}
          >
            <Play className="w-8 h-8 ml-1" />
          </Button>
        </div>
      )}

      {/* Панель управления */}
      {showControls && !hasError && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                disabled={!canPlay}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                disabled={!canPlay}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              disabled={!canPlay}
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
