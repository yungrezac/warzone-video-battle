
import React, { useCallback } from 'react';
import { useOptimizedVideoFeed } from '@/hooks/useOptimizedVideoFeed';
import { useLikeVideo } from '@/hooks/useVideoLikes';
import { useAuth } from '@/components/AuthWrapper';
import LazyVideoCard from './LazyVideoCard';
import VideoCardSkeleton from './VideoCardSkeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import FullScreenUserProfileModal from './FullScreenUserProfileModal';
import { useState } from 'react';

const OptimizedVideoFeed: React.FC = () => {
  const { data: videos, isLoading, error, refetch } = useOptimizedVideoFeed(20);
  const { user } = useAuth();
  const navigate = useNavigate();
  const likeVideoMutation = useLikeVideo();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast.error('Войдите в систему, чтобы ставить лайки');
      return;
    }

    const video = videos?.find(v => v.id === videoId);
    if (video) {
      console.log('🎯 OptimizedVideoFeed: Обрабатываем лайк для видео:', videoId);
      try {
        await likeVideoMutation.mutateAsync({
          videoId,
          isLiked: video.user_liked || false
        });
        console.log('✅ OptimizedVideoFeed: Лайк успешно обработан');
        
        toast.success(video.user_liked ? 'Лайк убран' : 'Лайк поставлен');
      } catch (error) {
        console.error('❌ OptimizedVideoFeed: Ошибка при обработке лайка:', error);
        toast.error('Ошибка при обработке лайка');
      }
    }
  };

  const handleUserClick = (userId: string | undefined) => {
    if (userId && userId !== user?.id) {
      setSelectedUserId(userId);
    }
  };

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-4">Ошибка загрузки видео</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 p-2">
        {isLoading ? (
          // Показываем скелетоны только при первой загрузке
          Array.from({ length: 6 }).map((_, index) => (
            <VideoCardSkeleton key={index} />
          ))
        ) : (
          videos?.map((video) => {
            const videoUser = video.profiles;
            const displayName = videoUser?.username || videoUser?.first_name || 'Роллер';
            
            // Преобразуем данные в формат, который ожидает VideoCard
            const videoCardData = {
              id: video.id,
              title: video.title,
              author: displayName,
              authorAvatar: videoUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
              thumbnail: video.thumbnail_url || 'https://i.postimg.cc/hGHyN1Z1/1eb82307-57c9-4efe-b3c2-5d1d49767f4c.png',
              videoUrl: video.video_url,
              likes: video.likes_count || 0,
              comments: video.comments_count || 0,
              views: video.views || 0,
              isWinner: false, // В оптимизированной версии пока не загружаем это поле
              timestamp: new Date(video.created_at).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              }),
              userLiked: video.user_liked || false,
              userId: videoUser?.id,
              authorIsPremium: false, // В оптимизированной версии пока не загружаем это поле
              category: video.category as 'Rollers' | 'BMX' | 'Skateboard'
            };

            return (
              <LazyVideoCard
                key={video.id}
                video={videoCardData}
                onLike={handleLike}
                onUserClick={() => handleUserClick(videoUser?.id)}
              />
            );
          })
        )}
      </div>

      {selectedUserId && (
        <FullScreenUserProfileModal
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
          userId={selectedUserId}
        />
      )}
    </>
  );
};

export default OptimizedVideoFeed;
