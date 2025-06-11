
import React, { useState, useEffect } from 'react';
import { Heart, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Link, useLocation } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import VideoComments from './VideoComments';
import CategoryBadge from './CategoryBadge';

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
  category?: 'Rollers' | 'BMX' | 'Skateboard';
}

interface VideoCardProps {
  video: Video;
  onLike: (id: string) => void;
  onRate: (id: string, rating: number) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onLike, onRate }) => {
  const [showRating, setShowRating] = useState(false);
  const [localUserLiked, setLocalUserLiked] = useState(video.userLiked || false);
  const [localUserRating, setLocalUserRating] = useState(video.userRating || 0);
  const [localLikes, setLocalLikes] = useState(video.likes || 0);
  const location = useLocation();

  // Обновляем локальное состояние при изменении props
  useEffect(() => {
    console.log('🔄 VideoCard обновление состояния для видео:', {
      videoId: video.id,
      userLiked: video.userLiked,
      localUserLiked,
      userRating: video.userRating,
      likes: video.likes,
      localLikes
    });
    
    setLocalUserLiked(video.userLiked || false);
    setLocalUserRating(video.userRating || 0);
    setLocalLikes(video.likes || 0);
  }, [video.userLiked, video.userRating, video.likes, video.id]);

  const handleLike = () => {
    console.log('💖 VideoCard handleLike вызван для видео:', video.id, 'текущий статус лайка:', localUserLiked);
    
    // Мгновенно обновляем локальное состояние для лучшего UX
    const newLikedState = !localUserLiked;
    const newLikesCount = newLikedState ? localLikes + 1 : localLikes - 1;
    
    setLocalUserLiked(newLikedState);
    setLocalLikes(Math.max(0, newLikesCount));
    
    onLike(video.id);
  };

  const handleRate = (rating: number) => {
    console.log('⭐ VideoCard handleRate вызван для видео:', video.id, 'рейтинг:', rating);
    // Мгновенно обновляем локальное состояние
    setLocalUserRating(rating);
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
          <AspectRatio ratio={9 / 16} className="bg-black">
            <VideoPlayer
              src={video.videoUrl}
              thumbnail={video.thumbnail}
              title={video.title}
              className="w-full h-full"
              videoId={video.id}
            />
          </AspectRatio>
        ) : (
          <AspectRatio ratio={9 / 16} className="bg-black">
            <div className="relative w-full h-full">
              <img 
                src={video.thumbnail} 
                alt={video.title}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <div className="text-white text-center">
                  <p className="text-sm opacity-75">Видео недоступно</p>
                </div>
              </div>
            </div>
          </AspectRatio>
        )}
      </div>

      <div className="p-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center flex-1 min-w-0">
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
          </div>
          <div className="flex items-center space-x-2">
            {video.category && (
              <CategoryBadge category={video.category} />
            )}
            <span className="text-gray-500 text-xs">{video.timestamp}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`${localUserLiked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500 h-7 px-1.5`}
            >
              <Heart className={`w-3.5 h-3.5 mr-1 ${localUserLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{localLikes}</span>
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
              <span className="text-xs">{Number(video.rating).toFixed(1)}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 h-7 px-1.5"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span className="text-xs">{video.views}</span>
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
                    className={`w-4 h-4 ${star <= localUserRating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
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
