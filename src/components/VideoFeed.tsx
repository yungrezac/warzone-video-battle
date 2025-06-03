
import React from 'react';
import VideoCard from './VideoCard';
import { useVideos, useLikeVideo, useRateVideo } from '@/hooks/useVideos';
import { Loader2 } from 'lucide-react';

const VideoFeed: React.FC = () => {
  const { data: videos, isLoading, error } = useVideos();
  const likeVideoMutation = useLikeVideo();
  const rateVideoMutation = useRateVideo();

  const handleLike = (videoId: string, isCurrentlyLiked: boolean) => {
    likeVideoMutation.mutate({ videoId, isLiked: isCurrentlyLiked });
  };

  const handleComment = (videoId: string) => {
    console.log(`Opening comments for video ${videoId}`);
    // TODO: Implement comment modal
  };

  const handleRate = (videoId: string, rating: number) => {
    rateVideoMutation.mutate({ videoId, rating });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] pb-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 pb-20">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Ошибка загрузки видео: {error.message}
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="p-4 pb-20 text-center">
        <div className="bg-gray-100 rounded-lg p-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Пока нет видео
          </h3>
          <p className="text-gray-500">
            Будьте первым, кто загрузит свой трюк!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-4 m-4 rounded-lg">
        <h2 className="text-lg font-bold mb-2">🔥 Трюк дня</h2>
        <p className="text-sm opacity-90">
          Голосование закончится в 23:59. Победитель получит баллы равные количеству оценок!
        </p>
      </div>

      <div className="px-4">
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={{
              id: video.id,
              title: video.title,
              author: video.user?.username || video.user?.telegram_username || 'Роллер',
              authorAvatar: video.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
              thumbnail: video.thumbnail_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
              videoUrl: video.video_url, // Передаем URL видео
              likes: video.likes_count || 0,
              comments: video.comments_count || 0,
              rating: video.average_rating || 0,
              views: video.views,
              isWinner: video.is_winner,
              timestamp: new Date(video.created_at).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              }),
              userLiked: video.user_liked || false,
              userRating: video.user_rating || 0,
            }}
            onLike={(id) => handleLike(id, video.user_liked || false)}
            onComment={handleComment}
            onRate={handleRate}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoFeed;
