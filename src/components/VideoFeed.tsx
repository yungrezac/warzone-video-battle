
import React, { useState } from 'react';
import { useVideos, useLikeVideo, useRateVideo } from '@/hooks/useVideos';
import { useAuth } from '@/components/AuthWrapper';
import VideoCard from '@/components/VideoCard';
import UploadVideo from '@/components/UploadVideo';
import WinnerAnnouncement from '@/components/WinnerAnnouncement';
import AdminWinnerControl from '@/components/AdminWinnerControl';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const VideoFeed: React.FC = () => {
  const { data: videos, isLoading, error } = useVideos();
  const { user } = useAuth();
  const likeVideoMutation = useLikeVideo();
  const rateVideoMutation = useRateVideo();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast.error('Войдите в систему, чтобы ставить лайки');
      return;
    }

    const video = videos?.find(v => v.id === videoId);
    if (video) {
      try {
        await likeVideoMutation.mutateAsync({ videoId, isLiked: video.user_liked || false });
        toast.success(video.user_liked ? 'Лайк убран' : 'Лайк поставлен');
      } catch (error) {
        console.error('Ошибка при обработке лайка:', error);
        toast.error('Ошибка при обработке лайка');
      }
    }
  };

  const handleRate = async (videoId: string, rating: number) => {
    if (!user) {
      toast.error('Войдите в систему, чтобы ставить оценки');
      return;
    }

    try {
      await rateVideoMutation.mutateAsync({ videoId, rating });
      toast.success(`Оценка ${rating} поставлена`);
    } catch (error) {
      console.error('Ошибка при выставлении оценки:', error);
      toast.error('Ошибка при выставлении оценки');
    }
  };

  const handleViewWinner = (videoId: string) => {
    // Скроллим к видео и выделяем его
    setSelectedVideoId(videoId);
    const videoElement = document.getElementById(`video-${videoId}`);
    if (videoElement) {
      videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setSelectedVideoId(null), 3000); // Убираем выделение через 3 секунды
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] pb-16">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 pb-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          Ошибка загрузки видео
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Winner Announcement */}
      <WinnerAnnouncement onViewWinner={handleViewWinner} />
      
      {/* Admin Control */}
      <AdminWinnerControl />
      
      {/* Upload Video */}
      <UploadVideo />
      
      {/* Video Feed */}
      <div className="p-3 space-y-4">
        {videos && videos.length > 0 ? (
          videos.map((video) => (
            <div 
              key={video.id} 
              id={`video-${video.id}`}
              className={selectedVideoId === video.id ? 'ring-2 ring-yellow-400 rounded-lg' : ''}
            >
              <VideoCard
                video={{
                  id: video.id,
                  title: video.title,
                  author: video.user?.username || video.user?.telegram_username || 'Роллер',
                  authorAvatar: video.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
                  thumbnail: video.thumbnail_url || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
                  videoUrl: video.video_url,
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
                onLike={handleLike}
                onRate={handleRate}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Пока нет загруженных видео</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoFeed;
