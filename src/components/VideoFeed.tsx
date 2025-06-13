
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoCard from './VideoCard';
import VideoCardSkeleton from './VideoCardSkeleton';
import CategorySelector, { type CategoryWithAll } from './CategorySelector';
import { useVideos } from '@/hooks/useVideos';
import { useAuth } from './AuthWrapper';

interface VideoFeedProps {
  onUploadClick?: () => void;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ onUploadClick }) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithAll>('all');
  const { data: videos = [], isLoading, error } = useVideos(selectedCategory);

  if (error) {
    console.error('VideoFeed error:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800">Лента</h1>
          {onUploadClick && (
            <Button
              onClick={onUploadClick}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Загрузить
            </Button>
          )}
        </div>

        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <VideoCard 
                key={video.id} 
                video={video}
                onLike={() => {}}
                onRate={() => {}}
              />
            ))}
          </div>
        )}

        {videos.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <p>Видео в этой категории пока нет</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoFeed;
