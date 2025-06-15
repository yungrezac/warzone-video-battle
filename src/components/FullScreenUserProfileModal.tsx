import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Calendar, Trophy, Video, ArrowLeft, Award, UserPlus, BellRing, Heart, Eye, ThumbsUp, Loader2 } from 'lucide-react';
import { useOtherUserProfile } from '@/hooks/useOtherUserProfile';
import { useUserVideos } from '@/hooks/useUserVideos';
import VideoCard from './VideoCard';
import { useLikeVideo } from '@/hooks/useVideoLikes';
import { useAuth } from './AuthWrapper';
import { Button } from './ui/button';
import { toast } from 'sonner';
import PremiumBadge from './PremiumBadge';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPoints } from '@/lib/utils';
import AchievementCard from './AchievementCard';

interface FullScreenUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

const FullScreenUserProfileModal: React.FC<FullScreenUserProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  userId 
}) => {
  const { user } = useAuth();
  const likeVideoMutation = useLikeVideo();
  const { isSubscribed, subscribe, unsubscribe, isLoadingSubscription } = useUserSubscriptions(userId || undefined);
  const [showSubscribeConfirm, setShowSubscribeConfirm] = useState(false);
  
  const { data: userProfile, isLoading: profileLoading } = useOtherUserProfile(userId);
  const { data: userVideos } = useUserVideos(userId);

  const handleSubscribeClick = () => {
    if (!user) {
      toast.error('Сначала нужно войти в систему');
      return;
    }
    if (userId) {
      if (isSubscribed) {
        unsubscribe(userId);
      } else {
        setShowSubscribeConfirm(true);
      }
    }
  };

  const confirmSubscription = () => {
    if (userId) {
      subscribe(userId);
    }
    setShowSubscribeConfirm(false);
  };

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast.error('Сначала нужно войти в систему');
      return;
    }
    try {
      await likeVideoMutation.mutateAsync({ videoId });
    } catch (error) {
      console.error('Ошибка при лайке видео:', error);
      toast.error('Не удалось поставить лайк');
    }
  };

  if (profileLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full h-full max-w-none max-h-none m-0 p-0 rounded-none flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </DialogContent>
      </Dialog>
    );
  }

  if (!userProfile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full h-full max-w-none max-h-none m-0 p-0 rounded-none flex justify-center items-center">
          <p>Профиль не найден.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none max-h-none m-0 p-0 rounded-none" hideCloseButton>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Header with back button */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 flex items-center sticky top-0 z-50">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 mr-2 p-1"
              onClick={onClose}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-bold">Профиль</h1>
            {user?.id !== userId && (
              <Button
                variant={isSubscribed ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleSubscribeClick}
                className={`ml-auto ${isSubscribed ? '' : 'text-white border-white hover:bg-white/20 hover:text-white'}`}
                disabled={isLoadingSubscription}
              >
                {isLoadingSubscription ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UserPlus className="w-4 h-4 mr-2" />}
                {isSubscribed ? 'Отписаться' : 'Подписаться'}
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
              <div className="flex items-center mb-2">
                <img
                  src={userProfile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
                  alt={userProfile.username || 'Роллер'}
                  className="w-12 h-12 rounded-full border-2 border-white mr-2"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">
                      {userProfile.username || userProfile.telegram_username || 'Роллер'}
                    </h2>
                    {userProfile.is_premium && <PremiumBadge size="sm" />}
                  </div>
                  {userProfile.first_name && userProfile.last_name && (
                    <p className="text-blue-100 text-sm">
                      {userProfile.first_name} {userProfile.last_name}
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

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold">{userProfile?.followers_count || 0}</div>
                  <div className="text-xs opacity-90">Подписчики</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold">{userProfile?.following_count || 0}</div>
                  <div className="text-xs opacity-90">Подписки</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold">{userProfile?.wins_count || 0}</div>
                  <div className="text-xs opacity-90">Побед</div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="p-3">
              <h3 className="text-lg font-semibold mb-2">Статистика</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center bg-white rounded-lg shadow-sm p-2">
                  <Video className="w-5 h-5 mr-2 text-blue-500" />
                  <div>
                    <div className="font-bold text-sm">Видео</div>
                    <div className="text-xs text-gray-500">{userProfile?.total_videos || 0}</div>
                  </div>
                </div>
                <div className="flex items-center bg-white rounded-lg shadow-sm p-2">
                  <Heart className="w-5 h-5 mr-2 text-red-500" />
                  <div>
                    <div className="font-bold text-sm">Лайки</div>
                    <div className="text-xs text-gray-500">{userProfile?.total_likes || 0}</div>
                  </div>
                </div>
                <div className="flex items-center bg-white rounded-lg shadow-sm p-2">
                  <Eye className="w-5 h-5 mr-2 text-green-500" />
                  <div>
                    <div className="font-bold text-sm">Просмотры</div>
                    <div className="text-xs text-gray-500">{userProfile?.total_views || 0}</div>
                  </div>
                </div>
                <div className="flex items-center bg-white rounded-lg shadow-sm p-2">
                  <Award className="w-5 h-5 mr-2 text-yellow-500" />
                  <div>
                    <div className="font-bold text-sm">Достижения</div>
                    <div className="text-xs text-gray-500">{userProfile?.total_achievements || 0}</div>
                  </div>
                </div>
                <div className="flex items-center bg-white rounded-lg shadow-sm p-2">
                  <Trophy className="w-5 h-5 mr-2 text-purple-500" />
                  <div>
                    <div className="font-bold text-sm">Баллы</div>
                    <div className="text-xs text-gray-500">{formatPoints(userProfile?.total_points || 0)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            {userProfile?.recent_achievements && userProfile?.recent_achievements.length > 0 && (
              <div className="p-3">
                <h3 className="text-lg font-semibold mb-2">Последние достижения</h3>
                <div className="flex gap-3 overflow-x-auto pb-3">
                  {userProfile.recent_achievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              </div>
            )}

            {/* Videos Section */}
            <div className="p-3">
              <h3 className="text-lg font-semibold mb-2">Видео</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userVideos?.map((video) => (
                  <VideoCard key={video.id} video={video} onLike={handleLike} />
                ))}
              </div>
              {(!userVideos || userVideos.length === 0) && (
                <div className="text-center text-gray-500 py-4">
                  У этого пользователя пока нет видео.
                </div>
              )}
            </div>
          </div>
        </div>
        <AlertDialog open={showSubscribeConfirm} onOpenChange={setShowSubscribeConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-yellow-500" />
                Подтверждение подписки
              </AlertDialogTitle>
              <AlertDialogDescription>
                Вы будете получать уведомления в Telegram, когда этот пользователь загрузит новое видео. Вы можете отключить это в настройках.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSubscription}>Подписаться</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default FullScreenUserProfileModal;
