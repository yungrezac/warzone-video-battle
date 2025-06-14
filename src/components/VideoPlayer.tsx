
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [isIntersecting, setIsIntersecting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { markVideoAsViewed } = useVideoViews();
  const { currentPlayingVideo, setCurrentPlayingVideo } = useVideoPlayback();

  // Intersection Observer для ленивой загрузки
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Останавливаем видео если играет другое видео
  useEffect(() => {
    if (currentPlayingVideo && currentPlayingVideo !== videoId && isPlaying) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [currentPlayingVideo, videoId, isPlaying]);

  const handleVideoView = useCallback(async () => {
    if (videoId && !hasViewBeenCounted) {
      try {
        await markVideoAsViewed(videoId);
        setHasViewBeenCounted(true);
      } catch (error) {
        console.error('❌ Ошибка при засчитывании просмотра:', error);
      }
    }
  }, [videoId, hasViewBeenCounted, markVideoAsViewed]);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setCurrentPlayingVideo(null);
      } else {
        videoRef.current.play();
        if (videoId) {
          setCurrentPlayingVideo(videoId);
        }
        handleVideoView();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, videoId, setCurrentPlayingVideo, handleVideoView]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (videoRef.current && videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  }, []);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentPlayingVideo(null);
  }, [setCurrentPlayingVideo]);

  const handleMouseEnter = useCallback(() => {
    setShowControls(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isPlaying) {
      setShowControls(false);
    }
  }, [isPlaying]);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isIntersecting ? (
        <video
          ref={videoRef}
          src={src}
          poster={thumbnail}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          onEnded={handleVideoEnd}
          onPlay={() => {
            setIsPlaying(true);
            if (videoId) setCurrentPlayingVideo(videoId);
            handleVideoView();
          }}
          onPause={() => {
            setIsPlaying(false);
            setCurrentPlayingVideo(null);
          }}
          playsInline
          preload="metadata"
        />
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center bg-gray-800 cursor-pointer"
          onClick={togglePlay}
          style={{
            backgroundImage: `url(${thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <Button
            size="lg"
            className="bg-white bg-opacity-80 hover:bg-opacity-100 text-black rounded-full w-16 h-16"
          >
            <Play className="w-8 h-8 ml-1" />
          </Button>
        </div>
      )}
      
      {/* Центральная кнопка воспроизведения */}
      {!isPlaying && isIntersecting && (
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
      {showControls && isIntersecting && (
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
