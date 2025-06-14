
import React, { useState } from 'react';
import { Heart, MessageCircle, Star, Play, Trophy, Eye } from 'lucide-react';
import { useAuth } from '@/components/AuthWrapper';
import VideoPlayer from './VideoPlayer';
import VideoComments from './VideoComments';
import CategoryBadge from './CategoryBadge';
import FullScreenUserProfileModal from './FullScreenUserProfileModal';
import { Button } from '@/components/ui/button';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    video_url: string;
    thumbnail_url?: string;
    user_id: string;
    category?: 'Rollers' | 'BMX' | 'Skateboard';
    created_at: string;
    views?: number;
    likes_count: number;
    comments_count: number;
    average_rating: number;
    user_liked: boolean;
    user_rating: number;
    profiles?: {
      username?: string;
      telegram_username?: string;
      avatar_url?: string;
    };
  };
  onLike: (videoId: string) => void;
  onRate: (videoId: string, rating: number) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onLike, onRate }) => {
  const { user } = useAuth();
  const [showPlayer, setShowPlayer] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const handleLikeClick = () => {
    console.log('💖 VideoCard: Клик по лайку для видео:', video.id);
    onLike(video.id);
  };

  const handleStarClick = (rating: number) => {
    console.log('⭐ VideoCard: Клик по звезде для видео:', video.id, 'рейтинг:', rating);
    onRate(video.id, rating);
  };

  const handleAuthorClick = () => {
    if (video.user_id && video.user_id !== user?.id) {
      setShowUserProfile(true);
    }
  };

  // Определяем автора и аватар
  const author = video.profiles?.username || video.profiles?.telegram_username || 'Пользователь';
  const authorAvatar = video.profiles?.avatar_url || '/placeholder.svg';
  const thumbnail = video.thumbnail_url || '/placeholder.svg';

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-3">
        {/* Header */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src={authorAvatar}
                alt={author}
                className="w-8 h-8 rounded-full mr-2 cursor-pointer"
                onClick={handleAuthorClick}
              />
              <div>
                <h3 
                  className="font-semibold text-sm cursor-pointer hover:text-blue-600"
                  onClick={handleAuthorClick}
                >
                  {author}
                </h3>
                <p className="text-xs text-gray-500">
                  {new Date(video.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {video.category && <CategoryBadge category={video.category} />}
            </div>
          </div>
        </div>

        {/* Video Thumbnail */}
        <div className="relative">
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full aspect-video object-cover cursor-pointer"
            onClick={() => setShowPlayer(true)}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={() => setShowPlayer(true)}
              className="bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-3"
            >
              <Play className="w-6 h-6 text-white fill-white" />
            </Button>
          </div>
          {video.views !== undefined && video.views > 0 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {video.views}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h4 className="font-semibold text-base mb-2">{video.title}</h4>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLikeClick}
                className={`flex items-center space-x-1 ${
                  video.user_liked ? 'text-red-500' : 'text-gray-600'
                } hover:text-red-500 transition-colors`}
              >
                <Heart className={`w-5 h-5 ${video.user_liked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{video.likes_count}</span>
              </button>

              <VideoComments videoId={video.id} />
            </div>

            {/* Rating Stars */}
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  className={`${
                    star <= video.user_rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                >
                  <Star className={`w-4 h-4 ${star <= video.user_rating ? 'fill-current' : ''}`} />
                </button>
              ))}
              <span className="text-sm text-gray-600 ml-1">
                {video.average_rating > 0 ? video.average_rating.toFixed(1) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {showPlayer && (
        <VideoPlayer
          url={video.video_url}
          title={video.title}
          onClose={() => setShowPlayer(false)}
        />
      )}

      {/* User Profile Modal */}
      {showUserProfile && video.user_id && (
        <FullScreenUserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userId={video.user_id}
        />
      )}
    </>
  );
};

export default VideoCard;
