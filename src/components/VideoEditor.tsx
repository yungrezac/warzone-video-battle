
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Scissors, Video } from 'lucide-react';

interface VideoEditorProps {
  videoFile: File;
  onThumbnailSelect: (thumbnailBlob: Blob, thumbnailTime: number) => void;
  onVideoTrim: (startTime: number, endTime: number) => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ 
  videoFile, 
  onThumbnailSelect, 
  onVideoTrim 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedThumbnailTime, setSelectedThumbnailTime] = useState(0);

  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  const handleVideoLoad = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
      setEndTime(videoDuration);
      setCurrentTime(0);
      setSelectedThumbnailTime(0);
    }
  };

  const handleTimeChange = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const captureThumbnail = async (time: number) => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Устанавливаем время видео
    video.currentTime = time;
    
    // Ждем пока кадр загрузится
    await new Promise(resolve => {
      video.onseeked = resolve;
    });

    // Устанавливаем размеры canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Рисуем кадр на canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Конвертируем в blob
    canvas.toBlob((blob) => {
      if (blob) {
        onThumbnailSelect(blob, time);
        setSelectedThumbnailTime(time);
      }
    }, 'image/jpeg', 0.8);
  };

  const handleSelectThumbnail = () => {
    captureThumbnail(currentTime);
  };

  const handleTrimVideo = () => {
    onVideoTrim(startTime, endTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-48 object-contain"
          onLoadedMetadata={handleVideoLoad}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          controls
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {duration > 0 && (
        <div className="space-y-4">
          {/* Выбор кадра для превью */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Выбор кадра для превью</label>
              <span className="text-xs text-gray-500">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <Slider
              value={[currentTime]}
              onValueChange={([value]) => handleTimeChange(value)}
              max={duration}
              step={0.1}
              className="w-full"
            />
            <Button 
              onClick={handleSelectThumbnail}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <Video className="w-4 h-4 mr-2" />
              Выбрать текущий кадр как превью
            </Button>
            {selectedThumbnailTime > 0 && (
              <p className="text-xs text-green-600">
                ✓ Превью выбрано на {formatTime(selectedThumbnailTime)}
              </p>
            )}
          </div>

          {/* Обрезка видео */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Обрезка видео</label>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">Начало</span>
                <span className="text-xs">{formatTime(startTime)}</span>
              </div>
              <Slider
                value={[startTime]}
                onValueChange={([value]) => setStartTime(Math.min(value, endTime - 1))}
                max={duration}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">Конец</span>
                <span className="text-xs">{formatTime(endTime)}</span>
              </div>
              <Slider
                value={[endTime]}
                onValueChange={([value]) => setEndTime(Math.max(value, startTime + 1))}
                max={duration}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-xs text-blue-700">
                Длительность: {formatTime(endTime - startTime)}
              </p>
            </div>

            <Button 
              onClick={handleTrimVideo}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <Scissors className="w-4 h-4 mr-2" />
              Применить обрезку ({formatTime(startTime)} - {formatTime(endTime)})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoEditor;
