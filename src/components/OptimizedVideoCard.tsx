
import React, { memo, useCallback } from 'react';
import { Heart, MessageCircle, Eye, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoPlayer from './VideoPlayer';
import CategoryBadge from './CategoryBadge';

interface OptimizedVideoCardProps {
  video: {
    id: string;
    title: string;
    author: string;
    authorAvatar: string;
    thumbnail: string;
    videoUrl: string;
    likes: number;
    comments: number;
    views: number;
    isWinner?: boolean;
    timestamp: string;
    userLiked: boolean;
    userId: string;
    category?: string;
  };
  onLike: (videoId: string) => void;
}

const OptimizedVideoCard = memo<OptimizedVideoCardProps>(({ video, onLike }) => {
  const handleLikeClick = useCallback(() => {
    onLike(video.id);
  }, [video.id, onLike]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={video.authorAvatar}
            alt={video.author}
            className="w-10 h-10 rounded-full object-cover"
            loading="lazy"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{video.author}</h3>
            <p className="text-xs text-gray-500">{video.timestamp}</p>
          </div>
        </div>
        {video.isWinner && (
          <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
            <Crown className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-800">Победитель</span>
          </div>
        )}
      </div>

      {/* Video Title */}
      <div className="px-3 pb-2">
        <h2 className="font-semibold text-gray-900 line-clamp-2">{video.title}</h2>
        {video.category && (
          <div className="mt-2">
            <CategoryBadge category={video.category as any} />
          </div>
        )}
      </div>

      {/* Video Player */}
      <div className="aspect-video bg-black">
        <VideoPlayer
          src={video.videoUrl}
          thumbnail={video.thumbnail}
          title={video.title}
          videoId={video.id}
          className="w-full h-full"
        />
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLikeClick}
              className={`flex items-center space-x-1 ${
                video.userLiked ? 'text-red-500' : 'text-gray-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${video.userLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{video.likes}</span>
            </Button>
            
            <div className="flex items-center space-x-1 text-gray-600">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{video.comments}</span>
            </div>
            
            <div className="flex items-center space-x-1 text-gray-600">
              <Eye className="w-5 h-5" />
              <span className="text-sm">{video.views}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedVideoCard.displayName = 'OptimizedVideoCard';

export default OptimizedVideoCard;
