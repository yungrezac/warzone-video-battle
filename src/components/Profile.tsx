import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Video, Trash2, Settings, ArrowUpRight, Crown } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserVideos } from '@/hooks/useUserVideos';
import { useLikeVideo } from '@/hooks/useVideoLikes';
import { useRateVideo } from '@/hooks/useVideos';
import { useDeleteVideo } from '@/hooks/useDeleteVideo';
import { useAuth } from '@/components/AuthWrapper';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2 } from 'lucide-react';
import VideoCard from './VideoCard';
import DeleteVideoDialog from './DeleteVideoDialog';
import NotificationSettings from './NotificationSettings';
import WithdrawalModal from './WithdrawalModal';
import SubscriptionModal from './SubscriptionModal';
import PremiumBadge from './PremiumBadge';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const Profile: React.FC = () => {
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: userVideos, isLoading: videosLoading } = useUserVideos();
  const { isPremium, subscription } = useSubscription();
  const { user } = useAuth();
  const likeVideoMutation = useLikeVideo();
  const rateVideoMutation = useRateVideo();
  const deleteVideoMutation = useDeleteVideo();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<{id: string, title: string} | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast.error('Войдите в систему, чтобы ставить лайки');
      return;
    }

    const video = userVideos?.find(v => v.id === videoId);
    if (video) {
      console.log('🎯 Profile: Обрабатываем лайк для видео:', videoId, 'текущий статус:', video.user_liked);
      try {
        await likeVideoMutation.mutateAsync({ 
          videoId, 
          isLiked: video.user_liked || false 
        });
        console.log('✅ Profile: Лайк успешно обработан');
        toast.success(video.user_liked ? 'Лайк убран' : 'Лайк поставлен');
      } catch (error) {
        console.error('❌ Profile: Ошибка при обработке лайка:', error);
        toast.error('Ошибка при обработке лайка');
      }
    }
  };

  const handleRate = async (videoId: string, rating: number) => {
    if (!user) {
      toast.error('Войдите в систему, чтобы ставить оценки');
      return;
    }

    console.log('⭐ Profile: Ставим оценку видео:', videoId, 'рейтинг:', rating);
    try {
      await rateVideoMutation.mutateAsync({ videoId, rating });
      toast.success(`Оценка ${rating} поставлена`);
    } catch (error) {
      console.error('❌ Profile: Ошибка при выставлении оценки:', error);
      toast.error('Ошибка при выставлении оценки');
    }
  };

  const handleDeleteClick = (videoId: string, videoTitle: string) => {
    setVideoToDelete({ id: videoId, title: videoTitle });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;

    try {
      await deleteVideoMutation.mutateAsync(videoToDelete.id);
      toast.success('Видео успешно удалено');
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    } catch (error) {
      console.error('Ошибка удаления видео:', error);
      toast.error('Ошибка при удалении видео');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setVideoToDelete(null);
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] pb-16">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  // Используем данные из userProfile или fallback на данные из user
  const displayUser = userProfile || user;

  if (!displayUser) {
    return (
      <div className="p-3 pb-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          Не удалось загрузить профиль
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
        {/* Header with settings buttons */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 rounded-full p-1.5 mr-2">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Мой профиль</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 rounded-full"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 rounded-full"
              onClick={() => setIsWithdrawOpen(true)}
            >
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center mb-2">
          <img
            src={displayUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
            alt={displayUser.username || 'Роллер'}
            className="w-12 h-12 rounded-full border-2 border-white mr-2"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">
                {displayUser.username || displayUser.telegram_username || 'Роллер'}
              </h2>
              {isPremium && <PremiumBadge size="sm" />}
            </div>
            {displayUser.first_name && displayUser.last_name && (
              <p className="text-blue-100 text-sm">
                {displayUser.first_name} {displayUser.last_name}
              </p>
            )}
            <div className="flex items-center mt-0.5 text-blue-100">
              <Calendar className="w-3 h-3 mr-1" />
              <span className="text-xs">
                В Roller Tricks с {new Date(userProfile?.created_at || Date.now()).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{userProfile?.total_points || 0}</div>
            <div className="text-xs opacity-90">Баллов</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{userProfile?.wins_count || 0}</div>
            <div className="text-xs opacity-90">Побед</div>
          </div>
        </div>
      </div>

      {/* Premium Section */}
      <div className="p-2">
        {isPremium ? (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold mb-1 flex items-center">
                  <Crown className="w-4 h-4 mr-2" />
                  Premium активен
                </h3>
                <p className="text-sm opacity-90">
                  {subscription && `До ${new Date(subscription.expires_at).toLocaleDateString('ru-RU')}`}
                </p>
              </div>
              <PremiumBadge size="md" />
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold mb-1">Получите Premium!</h3>
                <p className="text-sm opacity-90">
                  Эксклюзивные функции за 300 ⭐
                </p>
              </div>
              <SubscriptionModal>
                <Button 
                  size="sm"
                  className="bg-white hover:bg-gray-100 text-orange-600 font-bold"
                >
                  <Crown className="w-4 h-4 mr-1" />
                  Подключить
                </Button>
              </SubscriptionModal>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="p-2">
          <div className="bg-white rounded-lg shadow-md p-2 mb-3">
            <h3 className="text-base font-semibold mb-2 flex items-center">
              <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
              Статистика
            </h3>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-base font-bold text-blue-600">{userProfile?.total_videos || 0}</div>
                <div className="text-xs text-gray-600">Трюков</div>
              </div>
              <div>
                <div className="text-base font-bold text-red-500">{userProfile?.total_likes || 0}</div>
                <div className="text-xs text-gray-600">Лайков</div>
              </div>
              <div>
                <div className="text-base font-bold text-green-500">{userProfile?.total_views || 0}</div>
                <div className="text-xs text-gray-600">Просмотров</div>
              </div>
            </div>

            <div className="mt-2 p-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700 text-sm">Уровень:</span>
                <span className="font-bold text-orange-600 text-sm">
                  {(userProfile?.total_points || 0) < 100 ? 'Новичок' :
                   (userProfile?.total_points || 0) < 500 ? 'Любитель' :
                   (userProfile?.total_points || 0) < 1000 ? 'Мастер' : 'Профи'}
                </span>
              </div>
            </div>
          </div>

          {/* Points System Info */}
          <div className="bg-white rounded-lg shadow-md p-2 mb-3">
            <h3 className="text-base font-semibold mb-2 flex items-center">
              <Trophy className="w-4 h-4 mr-2 text-green-500" />
              Система баллов
            </h3>
            
            <div className="text-xs space-y-1 text-gray-600">
              <div className="flex justify-between">
                <span>Загрузка видео:</span>
                <span className="font-semibold text-green-600">+100 баллов</span>
              </div>
              <div className="flex justify-between">
                <span>Получен лайк:</span>
                <span className="font-semibold text-green-600">+3 балла</span>
              </div>
              <div className="flex justify-between">
                <span>Получен комментарий:</span>
                <span className="font-semibold text-green-600">+2 балла</span>
              </div>
              <div className="flex justify-between">
                <span>Получен просмотр:</span>
                <span className="font-semibold text-green-600">+1 балл</span>
              </div>
              <div className="flex justify-between">
                <span>Поставить лайк:</span>
                <span className="font-semibold text-blue-600">+3 балла</span>
              </div>
              <div className="flex justify-between">
                <span>Написать комментарий:</span>
                <span className="font-semibold text-blue-600">+2 балла</span>
              </div>
            </div>
          </div>

          {userProfile?.is_premium && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-2 mb-3">
              <h3 className="text-base font-bold mb-1">⭐ Premium статус</h3>
              <p className="text-sm opacity-90">
                У вас есть доступ к эксклюзивным функциям!
              </p>
            </div>
          )}

          {/* Video Feed Section */}
          <div className="bg-white rounded-lg shadow-md p-2">
            <h3 className="text-base font-semibold mb-2 flex items-center">
              <Video className="w-4 h-4 mr-2 text-purple-500" />
              Мои трюки ({userProfile?.total_videos || 0})
            </h3>
            
            {videosLoading ? (
              <div className="flex justify-center py-3">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (userProfile?.total_videos || 0) === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">У вас пока нет загруженных трюков</p>
                <p className="text-xs mt-1">Загрузите свой первый трюк во вкладке "Загрузить"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {userVideos?.map(video => (
                  <div key={video.id} className="relative">
                    <VideoCard
                      video={{
                        id: video.id,
                        title: video.title,
                        author: displayUser.username || displayUser.telegram_username || 'Роллер',
                        authorAvatar: displayUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(video.id, video.title)}
                      className="absolute top-2 right-2 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteVideoDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteVideoMutation.isPending}
        videoTitle={videoToDelete?.title || ''}
      />

      {/* Modals for settings and withdraw */}
      <NotificationSettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      
      <WithdrawalModal 
        isOpen={isWithdrawOpen} 
        onClose={() => setIsWithdrawOpen(false)}
        userPoints={userProfile?.total_points || 0}
      />
    </div>
  );
};

export default Profile;
