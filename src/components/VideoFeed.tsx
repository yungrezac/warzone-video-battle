
import React, { useState, useEffect } from 'react';
import { useVideos, useLikeVideo, useRateVideo } from '@/hooks/useVideos';
import { useAuth } from '@/components/AuthWrapper';
import { useVideoViews } from '@/hooks/useVideoViews';
import VideoCard from './VideoCard';
import VideoCardSkeleton from './VideoCardSkeleton';
import BannerRotation from './BannerRotation';
import AdminWinnerControl from './AdminWinnerControl';
import { toast } from 'sonner';

const VideoFeed: React.FC = () => {
  const { data: videos, isLoading, error } = useVideos();
  const { user } = useAuth();
  const likeVideoMutation = useLikeVideo();
  const rateVideoMutation = useRateVideo();
  const { markVideoAsViewed } = useVideoViews();

  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const videoId = entry.target.getAttribute('data-video-id');
            if (videoId && !viewedVideos.has(videoId)) {
              markVideoAsViewed(videoId);
              setViewedVideos(prev => new Set(prev).add(videoId));
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const videoElements = document.querySelectorAll('[data-video-id]');
    videoElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [videos, markVideoAsViewed, viewedVideos]);

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast.error('Войдите в систему, чтобы ставить лайки');
      return;
    }

    const video = videos?.find(v => v.id === videoId);
    if (video) {
      console.log('Обрабатываем лайк для видео:', videoId, 'текущий статус:', video.user_liked);
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

    console.log('Ставим оценку видео:', videoId, 'рейтинг:', rating);
    try {
      await rateVideoMutation.mutateAsync({ videoId, rating });
      toast.success(`Оценка ${rating} поставлена`);
    } catch (error) {
      console.error('Ошибка при выставлении оценки:', error);
      toast.error('Ошибка при выставлении оценки');
    }
  };

  const handleViewWinner = (videoId: string) => {
    const videoElement = document.querySelector(`[data-video-id="${videoId}"]`);
    if (videoElement) {
      videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[300px] pb-16">
        <div className="text-center">
          <p className="text-red-600 mb-2">Ошибка загрузки видео</p>
          <p className="text-gray-500 text-sm">Попробуйте обновить страницу</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <AdminWinnerControl />
      
      <BannerRotation onViewWinner={handleViewWinner} />

      {isLoading ? (
        <div className="space-y-4 p-2">
          {[...Array(3)].map((_, index) => (
            <VideoCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-4 p-2">
          {videos?.map((video) => {
            const videoUser = video.profiles;
            const displayName = videoUser?.username || videoUser?.telegram_username || videoUser?.first_name || 'Роллер';
            
            return (
              <div key={video.id} data-video-id={video.id}>
                <VideoCard
                  video={{
                    id: video.id,
                    title: video.title,
                    author: displayName,
                    authorAvatar: videoUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
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
                    userId: video.user_id,
                  }}
                  onLike={handleLike}
                  onRate={handleRate}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
