
import React, { useCallback } from 'react';
import { useOptimizedVideoFeed } from '@/hooks/useOptimizedVideoFeed';
import { useLikeVideo } from '@/hooks/useVideoLikes';
import { useAuth } from '@/components/AuthWrapper';
import LazyVideoCard from './LazyVideoCard';
import VideoCardSkeleton from './VideoCardSkeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const OptimizedVideoFeed: React.FC = () => {
  const { data: videos, isLoading, error, refetch } = useOptimizedVideoFeed(20);
  const { user } = useAuth();
  const likeVideoMutation = useLikeVideo();

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
    <div className="space-y-2 p-2">
      {isLoading ? (
        // Показываем скелетоны только при первой загрузке
        Array.from({ length: 6 }).map((_, index) => (
          <VideoCardSkeleton key={index} />
        ))
      ) : (
        videos?.map((video) => (
          <LazyVideoCard
            key={video.id}
            video={video}
            onLike={handleLike}
          />
        ))
      )}
    </div>
  );
};

export default OptimizedVideoFeed;
