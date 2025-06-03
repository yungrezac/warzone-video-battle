
import React, { useState } from 'react';
import { Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
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
  userId?: string;
}

interface VideoCardProps {
  video: Video;
  onLike: (id: string) => void;
  onRate: (id: string, rating: number) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onLike, onRate }) => {
  const [showRating, setShowRating] = useState(false);
  const location = useLocation();

  const handleRate = (rating: number) => {
    onRate(video.id, rating);
    setShowRating(false);
  };

  // Не показываем ссылку если уже находимся на странице профиля этого пользователя
  const isOnUserProfile = location.pathname === `/user/${video.userId}`;

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${video.isWinner ? 'border-2 border-yellow-400' : ''}`}>
      {video.isWinner && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-center py-1 font-bold text-sm">
          🏆 ПОБЕДИТЕЛЬ ДНЯ 🏆
        </div>
      )}
      
      <div className="relative">
        {video.videoUrl ? (
          <VideoPlayer
            src={video.videoUrl}
            thumbnail={video.thumbnail}
            title={video.title}
            className="w-full h-40"
            videoId={video.id}
          />
        ) : (
          <div className="relative">
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <div className="text-white text-center">
                <p className="text-sm opacity-75">Видео недоступно</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white px-1.5 py-0.5 rounded text-xs">
          {video.views} просмотров
        </div>
      </div>

      <div className="p-2">
        <div className="flex items-center mb-1.5">
          {video.userId && !isOnUserProfile ? (
            <Link to={`/user/${video.userId}`} className="flex items-center flex-1 min-w-0 hover:opacity-80">
              <img 
                src={video.authorAvatar} 
                alt={video.author}
                className="w-7 h-7 rounded-full mr-2"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{video.title}</h3>
                <p className="text-gray-600 text-xs">@{video.author}</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center flex-1 min-w-0">
              <img 
                src={video.authorAvatar} 
                alt={video.author}
                className="w-7 h-7 rounded-full mr-2"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{video.title}</h3>
                <p className="text-gray-600 text-xs">@{video.author}</p>
              </div>
            </div>
          )}
          <span className="text-gray-500 text-xs ml-2">{video.timestamp}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(video.id)}
              className={`${video.userLiked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500 h-7 px-1.5`}
            >
              <Heart className={`w-3.5 h-3.5 mr-1 ${video.userLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{video.likes}</span>
            </Button>

            <VideoComments 
              videoId={video.id} 
              commentsCount={video.comments} 
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRating(!showRating)}
              className="text-gray-600 hover:text-yellow-500 h-7 px-1.5"
            >
              <Star className="w-3.5 h-3.5 mr-1" />
              <span className="text-xs">{video.rating.toFixed(1)}</span>
            </Button>
          </div>
        </div>

        {showRating && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Оцените видео:</p>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRate(star)}
                  className="p-1 h-auto"
                >
                  <Star 
                    className={`w-4 h-4 ${star <= (video.userRating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
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
