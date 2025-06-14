import React, { useState, useEffect } from 'react';
import { Heart, Eye } from 'lucide-react'; // Star удален из импорта
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
  // rating: number; // Удалено
  views: number;
  isWinner?: boolean;
  timestamp: string;
  userLiked?: boolean;
  // userRating?: number; // Удалено
  userId?: string;
  category?: 'Rollers' | 'BMX' | 'Skateboard';
}

interface VideoCardProps {
  video: Video;
  onLike: (id: string) => void;
  // onRate: (id: string, rating: number) => void; // Удалено
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onLike }) => {
  // const [showRating, setShowRating] = useState(false); // Удалено
  const [localUserLiked, setLocalUserLiked] = useState(video.userLiked || false);
  // const [localUserRating, setLocalUserRating] = useState(video.userRating || 0); // Удалено
  const location = useLocation();

  useEffect(() => {
    console.log('🔄 VideoCard синхронизация состояния для видео:', {
      videoId: video.id,
      userLiked: video.userLiked,
      previousLocalUserLiked: localUserLiked,
      // userRating: video.userRating, // Удалено
      // previousLocalUserRating: localUserRating // Удалено
    });
    
    if (video.userLiked !== localUserLiked) {
      console.log('📝 Обновляем localUserLiked с', localUserLiked, 'на', video.userLiked);
      setLocalUserLiked(video.userLiked || false);
    }
    
    // Блок синхронизации localUserRating удален
  }, [video.userLiked, video.id]); // video.userRating удален из зависимостей

  const handleLike = () => {
    console.log('💖 VideoCard handleLike вызван для видео:', {
      videoId: video.id,
      currentLocalUserLiked: localUserLiked,
      propsUserLiked: video.userLiked
    });
    
    const newLikedState = !localUserLiked;
    setLocalUserLiked(newLikedState);
    console.log('✨ Мгновенно изменили localUserLiked на:', newLikedState);
    
    onLike(video.id);
  };

  // const handleRate = (rating: number) => { // Функция удалена
  //   console.log('⭐ VideoCard handleRate вызван для видео:', video.id, 'рейтинг:', rating);
  //   setLocalUserRating(rating);
  //   onRate(video.id, rating);
  //   setShowRating(false);
  // };

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
              <span className="text-xs">{video.likes}</span>
            </Button>

            <VideoComments 
              videoId={video.id} 
              commentsCount={video.comments} 
            />

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
      </div>
    </div>
  );
};

export default VideoCard;
