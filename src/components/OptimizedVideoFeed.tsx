
import React, { useState, useCallback } from 'react';
import { useOptimizedVideoFeed } from '@/hooks/useOptimizedVideoFeed';
import LazyVideoCard from './LazyVideoCard';
import VideoCardSkeleton from './VideoCardSkeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const OptimizedVideoFeed: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const { data: videos, isLoading, error, refetch } = useOptimizedVideoFeed(20);

  const handleVideoSelect = useCallback((video: any) => {
    setSelectedVideo(video);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-4">Ошибка загрузки видео</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {isLoading ? (
        // Показываем скелетоны только при первой загрузке
        Array.from({ length: 6 }).map((_, index) => (
          <VideoCardSkeleton key={index} />
        ))
      ) : (
        videos?.map((video) => (
          <LazyVideoCard
            key={video.id}
            video={video}
            onVideoSelect={handleVideoSelect}
          />
        ))
      )}
    </div>
  );
};

export default OptimizedVideoFeed;
