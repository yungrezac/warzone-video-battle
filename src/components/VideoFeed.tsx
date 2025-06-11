import React, { useState } from 'react';
import { useVideos, useLikeVideo, useRateVideo } from '@/hooks/useVideos';
import { useAuth } from '@/components/AuthWrapper';
import VideoCard from '@/components/VideoCard';
import VideoCardSkeleton from '@/components/VideoCardSkeleton';
import WinnerAnnouncement from '@/components/WinnerAnnouncement';
import AdminWinnerControl from '@/components/AdminWinnerControl';
import FullScreenUploadModal from '@/components/FullScreenUploadModal';
import FullScreenUserProfileModal from '@/components/FullScreenUserProfileModal';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const VideoFeed: React.FC = () => {
  const { data: videos, isLoading, error, refetch } = useVideos();
  const { user, loading: authLoading } = useAuth();
  const likeVideoMutation = useLikeVideo();
  const rateVideoMutation = useRateVideo();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleLike = async (videoId: string) => {
    console.log('💖 Попытка поставить лайк:', { 
      videoId, 
      user: user ? `${user.id} (${user.username})` : 'null',
      authLoading,
      userExists: !!user
    });

    if (authLoading) {
      console.log('⏳ Авторизация еще загружается...');
      toast.error('Подождите, загружается авторизация...');
      return;
    }

    if (!user) {
      console.log('❌ Пользователь не авторизован');
      toast.error('Войдите в систему, чтобы ставить лайки');
      return;
    }

    const video = videos?.find(v => v.id === videoId);
    if (!video) {
      console.log('❌ Видео не найдено:', videoId);
      toast.error('Видео не найдено');
      return;
    }

    console.log('📊 Данные видео для лайка:', {
      id: video.id,
      user_liked: video.user_liked,
      likes_count: video.likes_count
    });

    try {
      console.log('🔄 Отправляем запрос на лайк...');
      await likeVideoMutation.mutateAsync({ 
        videoId, 
        isLiked: video.user_liked || false 
      });
      
      const action = video.user_liked ? 'убран' : 'поставлен';
      console.log('✅ Лайк успешно', action);
      toast.success(`Лайк ${action}`);
    } catch (error: any) {
      console.error('❌ Ошибка при обработке лайка:', {
        error: error.message,
        stack: error.stack,
        userId: user.id,
        videoId
      });
      toast.error(`Ошибка при обработке лайка: ${error.message || 'Неизвестная ошибка'}`);
    }
  };

  const handleRate = async (videoId: string, rating: number) => {
    console.log('⭐ Попытка поставить оценку:', { 
      videoId, 
      rating,
      user: user ? `${user.id} (${user.username})` : 'null',
      authLoading
    });

    if (authLoading) {
      console.log('⏳ Авторизация еще загружается...');
      toast.error('Подождите, загружается авторизация...');
      return;
    }

    if (!user) {
      console.log('❌ Пользователь не авторизован для оценки');
      toast.error('Войдите в систему, чтобы ставить оценки');
      return;
    }

    try {
      console.log('🔄 Отправляем запрос на оценку...');
      await rateVideoMutation.mutateAsync({ videoId, rating });
      console.log('✅ Оценка успешно поставлена');
      toast.success(`Оценка ${rating} поставлена`);
    } catch (error: any) {
      console.error('❌ Ошибка при выставлении оценки:', {
        error: error.message,
        userId: user.id,
        videoId,
        rating
      });
      toast.error(`Ошибка при выставлении оценки: ${error.message || 'Неизвестная ошибка'}`);
    }
  };

  const handleViewWinner = (videoId: string) => {
    setSelectedVideoId(videoId);
    const videoElement = document.getElementById(`video-${videoId}`);
    if (videoElement) {
      videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setSelectedVideoId(null), 3000);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Обновляем ленту...');
  };

  const handleUserProfileClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserProfileModalOpen(true);
  };

  // Показываем скелетоны пока загружается авторизация
  if (authLoading) {
    return (
      <div className="pb-16">
        <div className="p-3 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <VideoCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Показываем скелетоны пока загружаются видео
  if (isLoading) {
    return (
      <div className="pb-16">
        {/* Winner Announcement Skeleton */}
        <div className="p-3">
          <div className="bg-gray-200 animate-pulse rounded-lg p-4 mb-4">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
        
        {/* Upload Button */}
        <div className="p-3">
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Загрузить трюк
          </Button>
        </div>
        
        {/* Video Skeletons */}
        <div className="p-3 space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <VideoCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-16">
        <div className="p-3">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center">
            <p className="font-semibold mb-2">Ошибка загрузки видео</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Попробовать снова
            </Button>
          </div>
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
      
      {/* Upload Button */}
      <div className="p-3">
        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Загрузить трюк
        </Button>
      </div>
      
      {/* Video Feed */}
      <div className="p-3 space-y-4">
        {videos && videos.length > 0 ? (
          videos.map((video) => {
            console.log('🎬 Рендерим видео:', {
              id: video.id,
              title: video.title,
              user_liked: video.user_liked,
              user_rating: video.user_rating,
              likes_count: video.likes_count,
              comments_count: video.comments_count,
              average_rating: video.average_rating
            });

            return (
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
                    userId: video.user_id,
                    category: video.category as 'Rollers' | 'BMX' | 'Skateboard',
                  }}
                  onLike={handleLike}
                  onRate={handleRate}
                />
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Пока нет видео</h3>
            <p className="text-gray-500 mb-4">Станьте первым, кто поделится своим трюком!</p>
            <Button onClick={() => setIsUploadModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Загрузить первое видео
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <FullScreenUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
      
      {selectedUserId && (
        <FullScreenUserProfileModal 
          isOpen={isUserProfileModalOpen} 
          onClose={() => {
            setIsUserProfileModalOpen(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
        />
      )}
    </div>
  );
};

export default VideoFeed;
