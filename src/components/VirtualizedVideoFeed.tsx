
import React, { useState, useCallback, useMemo } from 'react';
import { useOptimizedVideos } from '@/hooks/useOptimizedVideos';
import { useLikeVideo } from '@/hooks/useVideoLikes';
import { useAuth } from '@/components/AuthWrapper';
import OptimizedVideoCard from './OptimizedVideoCard';
import VideoCardSkeleton from './VideoCardSkeleton';
import BannerRotation from './BannerRotation';
import AdminWinnerControl from './AdminWinnerControl';
import MinimalUploadForm from './MinimalUploadForm';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const VirtualizedVideoFeed: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  const { data: videos, isLoading, error, refetch } = useOptimizedVideos(currentPage, 10);
  const { user } = useAuth();
  const likeVideoMutation = useLikeVideo();

  const handleLike = useCallback(async (videoId: string) => {
    if (!user) {
      toast.error('Войдите в систему, чтобы ставить лайки');
      return;
    }

    const video = videos?.find(v => v.id === videoId);
    if (video) {
      try {
        await likeVideoMutation.mutateAsync({ 
          videoId, 
          isLiked: video.user_liked || false 
        });
        toast.success(video.user_liked ? 'Лайк убран' : 'Лайк поставлен');
      } catch (error) {
        console.error('❌ Ошибка при обработке лайка:', error);
        toast.error('Ошибка при обработке лайка');
      }
    }
  }, [videos, user, likeVideoMutation]);

  const handleUploadClick = useCallback(() => {
    if (!user) {
      toast.error('Войдите в систему для загрузки трюков');
      return;
    }
    setShowUploadForm(true);
  }, [user]);

  const handleUploadSuccess = useCallback(() => {
    setShowUploadForm(false);
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const optimizedVideos = useMemo(() => {
    return videos?.map((video) => {
      const videoUser = video.profiles;
      const displayName = videoUser?.username || videoUser?.telegram_username || 'Роллер';
      
      return {
        id: video.id,
        title: video.title,
        author: displayName,
        authorAvatar: videoUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
        thumbnail: video.thumbnail_url || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
        videoUrl: video.video_url,
        likes: video.likes_count || 0,
        comments: video.comments_count || 0,
        views: video.views || 0,
        isWinner: video.is_winner,
        timestamp: new Date(video.created_at).toLocaleString('ru-RU', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        }),
        userLiked: video.user_liked || false,
        userId: video.user_id,
        category: video.category,
      };
    }) || [];
  }, [videos]);

  if (showUploadForm) {
    return <MinimalUploadForm onSuccess={handleUploadSuccess} />;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[300px] pb-16">
        <div className="text-center">
          <p className="text-red-600 mb-2">Ошибка загрузки видео</p>
          <p className="text-gray-500 text-sm mb-4">Попробуйте обновить страницу</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <AdminWinnerControl />
      <BannerRotation />

      {/* Кнопка загрузки */}
      <div className="px-3 mb-4">
        <Button
          onClick={handleUploadClick}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg"
        >
          <Upload className="w-5 h-5 mr-2" />
          Загрузить свой трюк
        </Button>
      </div>

      {/* Лента видео */}
      <div className="space-y-4 p-2">
        {optimizedVideos.map((video) => (
          <OptimizedVideoCard
            key={video.id}
            video={video}
            onLike={handleLike}
          />
        ))}
        
        {isLoading && (
          <>
            {[...Array(3)].map((_, index) => (
              <VideoCardSkeleton key={`skeleton-${index}`} />
            ))}
          </>
        )}

        {/* Кнопка "Загрузить еще" */}
        {!isLoading && optimizedVideos.length > 0 && optimizedVideos.length % 10 === 0 && (
          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleLoadMore}
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? 'Загрузка...' : 'Загрузить еще'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualizedVideoFeed;
