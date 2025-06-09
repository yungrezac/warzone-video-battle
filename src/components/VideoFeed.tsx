
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVideos, useLikeVideo, useRateVideo } from '@/hooks/useVideos';
import { useAuth } from '@/components/AuthWrapper';
import { Loader2 } from 'lucide-react';
import VideoCard from './VideoCard';
import WinnerAnnouncement from './WinnerAnnouncement';
import UploadModal from './UploadModal';
import { toast } from 'sonner';

const VideoFeed: React.FC = () => {
  const { data: videos, isLoading } = useVideos();
  const { user } = useAuth();
  const likeVideoMutation = useLikeVideo();
  const rateVideoMutation = useRateVideo();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

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

  return (
    <div className="pb-16">
      {/* Upload Button */}
      <div className="p-3">
        <Button
          onClick={() => setUploadModalOpen(true)}
          className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Загрузить свой трюк
        </Button>
      </div>

      {/* Winner Announcement */}
      <WinnerAnnouncement />

      {/* Video Feed */}
      <div className="space-y-3 px-3">
        {videos && videos.length > 0 ? (
          videos.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              onLike={handleLike}
              onRate={handleRate}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Пока нет загруженных видео</p>
            <p className="text-xs mt-1">Станьте первым, кто поделится своим трюком!</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
      />
    </div>
  );
};

export default VideoFeed;
