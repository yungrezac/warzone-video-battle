
import React, { useState, useEffect, useRef } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { useLikeVideo } from '@/hooks/useVideoLikes';
import { useAuth } from '@/components/AuthWrapper';
import { useVideoViews } from '@/hooks/useVideoViews';
import VideoCard from './VideoCard';
import VideoCardSkeleton from './VideoCardSkeleton';
import AdminWinnerControl from './AdminWinnerControl';
import FullScreenUploadModal from './FullScreenUploadModal';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useHomeBanners } from '@/hooks/useHomeBanners';
import InlineBannerCard from './InlineBannerCard';
import FullScreenUserProfileModal from './FullScreenUserProfileModal';
import { useNavigate } from 'react-router-dom';
import { useVideoPlayback } from '@/contexts/VideoPlaybackContext';

const VideoFeed: React.FC = () => {
  const {
    data: videos,
    isLoading,
    error,
    refetch
  } = useVideos();
  const {
    data: banners
  } = useHomeBanners();
  const {
    user
  } = useAuth();
  const likeVideoMutation = useLikeVideo();
  const {
    markVideoAsViewed
  } = useVideoViews();
  const { currentPlayingVideo, setCurrentPlayingVideo } = useVideoPlayback();
  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set());
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedUserId && currentPlayingVideo) {
      console.log('👤 Профиль открыт, ставим на паузу видео:', currentPlayingVideo);
      setCurrentPlayingVideo(null);
    }
  }, [selectedUserId, currentPlayingVideo, setCurrentPlayingVideo]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const videoId = entry.target.getAttribute('data-video-id');
          if (videoId && !viewedVideos.has(videoId)) {
            console.log('👁️ Видео попало в область видимости:', videoId);
            setViewedVideos(prev => new Set(prev).add(videoId));
          }
        }
      });
    }, {
      threshold: 0.5
    });
    const videoElements = document.querySelectorAll('[data-video-id]');
    videoElements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [videos, viewedVideos]);

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast.error('Войдите в систему, чтобы ставить лайки');
      return;
    }
    const video = videos?.find(v => v.id === videoId);
    if (video) {
      console.log('🎯 VideoFeed: Обрабатываем лайк для видео:', videoId, 'текущий статус:', video.user_liked);
      try {
        await likeVideoMutation.mutateAsync({
          videoId,
          isLiked: video.user_liked || false
        });
        console.log('✅ VideoFeed: Лайк успешно обработан');
        toast.success(video.user_liked ? 'Лайк убран' : 'Лайк поставлен');
      } catch (error) {
        console.error('❌ VideoFeed: Ошибка при обработке лайка:', error);
        toast.error('Ошибка при обработке лайка');
      }
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const authorLink = target.closest('a[href^="/user/"]');

    if (authorLink) {
      e.preventDefault();
      e.stopPropagation();

      const href = authorLink.getAttribute('href');
      if (href) {
        const userId = href.split('/').pop();
        if (userId) {
          setSelectedUserId(userId);
        }
      }
    }
  };

  const handleViewWinner = (videoId: string) => {
    const videoElement = document.querySelector(`[data-video-id="${videoId}"]`);
    if (videoElement) {
      videoElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  const handleUploadClick = () => {
    if (!user) {
      toast.error('Войдите в систему для загрузки трюков');
      return;
    }
    fileInputRef.current?.click();
  };
  
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToUpload(file);
    }
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleUploadModalClose = () => {
    setFileToUpload(null);
    refetch();
  };

  if (error) {
    return <div className="flex justify-center items-center min-h-[300px] pb-16">
        <div className="text-center">
          <p className="text-red-600 mb-2">Ошибка загрузки видео</p>
          <p className="text-gray-500 text-sm">Попробуйте обновить страницу</p>
        </div>
      </div>;
  }

  const handleCloseProfileModal = () => {
    setSelectedUserId(null);
  }

  return <div className="min-h-screen bg-gray-50">
      {fileToUpload && (
        <FullScreenUploadModal 
          isOpen={!!fileToUpload} 
          onClose={handleUploadModalClose} 
          initialFile={fileToUpload}
        />
      )}
      <FullScreenUserProfileModal
        isOpen={!!selectedUserId}
        onClose={handleCloseProfileModal}
        userId={selectedUserId}
      />
      <AdminWinnerControl />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Кнопка загрузки трюка */}
      <div className="mb-4 px-[8px] pt-4">
        <Button onClick={handleUploadClick} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg px-0">
          <Upload className="w-5 h-5 mr-2" />
          Загрузить свой трюк
        </Button>
      </div>

      {isLoading ? <div className="space-y-4 px-2">
          {[...Array(3)].map((_, index) => <VideoCardSkeleton key={index} />)}
        </div> : <div className="space-y-4 px-2">
          {videos?.reduce((acc, video, index) => {
        const videoUser = video.profiles;
        const displayName = videoUser?.username || videoUser?.telegram_username || 'Роллер';

        acc.push(<div key={video.id} data-video-id={video.id} onClickCapture={handleCardClick}>
                <VideoCard video={{
            id: video.id,
            title: video.title,
            author: displayName,
            authorAvatar: videoUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
            thumbnail: video.thumbnail_url || 'https://i.postimg.cc/hGHyN1Z1/1eb82307-57c9-4efe-b3c2-5d1d49767f4c.png',
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
            authorIsPremium: videoUser?.is_premium
          }} onLike={handleLike} />
              </div>);

        const BANNER_FREQUENCY = 5;

        if ((index + 1) % BANNER_FREQUENCY === 0 && banners && banners.length > 0) {
          const bannerCycleIndex = Math.floor((index + 1) / BANNER_FREQUENCY);
          const bannerIndex = (bannerCycleIndex - 1) % banners.length;
          const bannerToShow = banners[bannerIndex];
          if (bannerToShow) {
            acc.push(<InlineBannerCard key={`banner-${bannerToShow.id}`} banner={bannerToShow} />);
          }
        }
        return acc;
      }, [] as React.ReactNode[])}
        </div>}
    </div>;
};

export default VideoFeed;
