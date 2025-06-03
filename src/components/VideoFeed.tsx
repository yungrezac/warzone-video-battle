
import React from 'react';
import VideoCard from './VideoCard';
import WinnerAnnouncement from './WinnerAnnouncement';
import { useVideos, useLikeVideo, useRateVideo } from '@/hooks/useVideos';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';

const VideoFeed: React.FC = () => {
  const { data: videos, isLoading, error } = useVideos();
  const { user } = useAuth();
  const likeVideoMutation = useLikeVideo();
  const rateVideoMutation = useRateVideo();

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
          Ошибка загрузки видео: {error.message}
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="p-3 pb-16 text-center">
        <div className="bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Пока нет видео
          </h3>
          <p className="text-gray-500 text-sm">
            Будьте первым, кто загрузит свой трюк!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Объявление о победителе */}
      <WinnerAnnouncement />

      <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-2 m-2 rounded-lg">
        <h2 className="text-base font-bold mb-1">🔥 Трюк дня</h2>
        <p className="text-sm opacity-90">
          Голосование закончится в 23:59. Победитель получит баллы равные количеству оценок!
        </p>
      </div>

      <div className="px-2 space-y-2">
        {videos.map(video => (
          <VideoCard
            key={video.id}
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
              userId: video.user_id,
            }}
            onLike={handleLike}
            onRate={handleRate}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoFeed;
