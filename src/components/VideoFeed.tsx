
import React, { useState, useRef, useCallback } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { useLikeVideo } from '@/hooks/useVideoLikes';
import { useRateVideo } from '@/hooks/useVideos';
import { useAuth } from '@/components/AuthWrapper';
import VideoCard from './VideoCard';
import CategorySelector from './CategorySelector';
import VideoCardSkeleton from './VideoCardSkeleton';
import WinnerAnnouncement from './WinnerAnnouncement';
import HomeBannerCarousel from './HomeBannerCarousel';
import AdminHomeBannerPanel from './AdminHomeBannerPanel';
import { toast } from 'sonner';

const VideoFeed: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const likeVideoMutation = useLikeVideo();
  const rateVideoMutation = useRateVideo();

  const {
    data: videos,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVideos(selectedCategory);

  const observer = useRef<IntersectionObserver>();
  const lastVideoElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, fetchNextPage, hasNextPage]);

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast.error('Войдите в систему, чтобы ставить лайки');
      return;
    }

    const allVideos = videos?.pages.flatMap(page => page) || [];
    const video = allVideos.find(v => v.id === videoId);
    
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Ошибка при загрузке видео</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const allVideos = videos?.pages.flatMap(page => page) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto">
        <WinnerAnnouncement />
        
        {/* Админская панель для управления банерами */}
        <AdminHomeBannerPanel />
        
        {/* Банеры главной страницы */}
        <HomeBannerCarousel />
        
        <CategorySelector 
          selectedCategory={selectedCategory} 
          onCategoryChange={setSelectedCategory} 
        />
        
        <div className="space-y-4">
          {isLoading ? (
            // Показываем скелетоны при загрузке
            Array.from({ length: 5 }).map((_, index) => (
              <VideoCardSkeleton key={index} />
            ))
          ) : allVideos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Нет видео в этой категории</p>
            </div>
          ) : (
            allVideos.map((video, index) => (
              <div
                key={video.id}
                ref={index === allVideos.length - 1 ? lastVideoElementRef : null}
              >
                <VideoCard
                  video={{
                    id: video.id,
                    title: video.title,
                    author: video.author || 'Роллер',
                    authorAvatar: video.author_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
                    authorId: video.author_id,
                    thumbnail: video.thumbnail || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
                    videoUrl: video.video_url,
                    likes: video.likes || 0,
                    comments: video.comments || 0,
                    rating: video.rating || 0,
                    views: video.views || 0,
                    isWinner: video.is_winner || false,
                    timestamp: new Date(video.created_at).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    }),
                    userLiked: video.user_liked || false,
                    userRating: video.user_rating || 0,
                    authorIsPremium: video.author_is_premium || false,
                  }}
                  onLike={handleLike}
                  onRate={handleRate}
                />
              </div>
            ))
          )}
          
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <VideoCardSkeleton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoFeed;
