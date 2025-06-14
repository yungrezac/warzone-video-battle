
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
    author: string;
    authorAvatar: string;
    thumbnail: string;
    videoUrl: string;
    likes: number;
    comments: number;
    rating: number;
    views?: number;
    isWinner?: boolean;
    timestamp: string;
    userLiked: boolean;
    userRating: number;
    userId?: string;
    category?: 'Rollers' | 'BMX' | 'Skateboard';
  };
  onLike: (videoId: string) => void;
  onRate: (videoId: string, rating: number) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onLike, onRate }) => {
  const { user } = useAuth();
  const [showPlayer, setShowPlayer] = useState(false);
  const [showComments, setShowComments] = useState(false);
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
    if (video.userId && video.userId !== user?.id) {
      setShowUserProfile(true);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-3">
        {/* Header */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src={video.authorAvatar}
                alt={video.author}
                className="w-8 h-8 rounded-full mr-2 cursor-pointer"
                onClick={handleAuthorClick}
              />
              <div>
                <h3 
                  className="font-semibold text-sm cursor-pointer hover:text-blue-600"
                  onClick={handleAuthorClick}
                >
                  {video.author}
                </h3>
                <p className="text-xs text-gray-500">{video.timestamp}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {video.category && <CategoryBadge category={video.category} />}
              {video.isWinner && (
                <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  <Trophy className="w-3 h-3 mr-1" />
                  <span className="text-xs font-semibold">Победитель</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video Thumbnail */}
        <div className="relative">
          <img
            src={video.thumbnail}
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
                  video.userLiked ? 'text-red-500' : 'text-gray-600'
                } hover:text-red-500 transition-colors`}
              >
                <Heart className={`w-5 h-5 ${video.userLiked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{video.likes}</span>
              </button>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-1 text-gray-600 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{video.comments}</span>
              </button>
            </div>

            {/* Rating Stars */}
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  className={`${
                    star <= video.userRating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                >
                  <Star className={`w-4 h-4 ${star <= video.userRating ? 'fill-current' : ''}`} />
                </button>
              ))}
              <span className="text-sm text-gray-600 ml-1">
                {video.rating > 0 ? video.rating.toFixed(1) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t bg-gray-50">
            <VideoComments videoId={video.id} />
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {showPlayer && (
        <VideoPlayer
          videoUrl={video.videoUrl}
          title={video.title}
          onClose={() => setShowPlayer(false)}
        />
      )}

      {/* User Profile Modal */}
      {showUserProfile && video.userId && (
        <FullScreenUserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userId={video.userId}
        />
      )}
    </>
  );
};

export default VideoCard;
