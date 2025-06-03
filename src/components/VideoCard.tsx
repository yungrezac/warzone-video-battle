
import React, { useState } from 'react';
import { Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoPlayer from './VideoPlayer';
import VideoComments from './VideoComments';

interface Video {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  thumbnail: string;
  videoUrl?: string;
  likes: number;
  comments: number;
  rating: number;
  views: number;
  isWinner?: boolean;
  timestamp: string;
  userLiked?: boolean;
  userRating?: number;
}

interface VideoCardProps {
  video: Video;
  onLike: (id: string) => void;
  onRate: (id: string, rating: number) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onLike, onRate }) => {
  const [showRating, setShowRating] = useState(false);

  const handleRate = (rating: number) => {
    onRate(video.id, rating);
    setShowRating(false);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden mb-4 ${video.isWinner ? 'border-2 border-yellow-400' : ''}`}>
      {video.isWinner && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-center py-2 font-bold">
          🏆 ПОБЕДИТЕЛЬ ДНЯ 🏆
        </div>
      )}
      
      <div className="relative">
        {video.videoUrl ? (
          <VideoPlayer
            src={video.videoUrl}
            thumbnail={video.thumbnail}
            title={video.title}
            className="w-full h-64"
          />
        ) : (
          <div className="relative">
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <div className="text-white text-center">
                <p className="text-sm opacity-75">Видео недоступно</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
          {video.views} просмотров
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center mb-3">
          <img 
            src={video.authorAvatar} 
            alt={video.author}
            className="w-10 h-10 rounded-full mr-3"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{video.title}</h3>
            <p className="text-gray-600 text-sm">@{video.author}</p>
          </div>
          <span className="text-gray-500 text-xs">{video.timestamp}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(video.id)}
              className={`${video.userLiked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500`}
            >
              <Heart className={`w-5 h-5 mr-1 ${video.userLiked ? 'fill-current' : ''}`} />
              {video.likes}
            </Button>

            <VideoComments 
              videoId={video.id} 
              commentsCount={video.comments} 
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRating(!showRating)}
              className="text-gray-600 hover:text-yellow-500"
            >
              <Star className="w-5 h-5 mr-1" />
              {video.rating.toFixed(1)}
            </Button>
          </div>
        </div>

        {showRating && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Оцените видео:</p>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRate(star)}
                  className="p-1"
                >
                  <Star 
                    className={`w-6 h-6 ${star <= (video.userRating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                  />
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
