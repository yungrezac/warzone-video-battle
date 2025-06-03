import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Video, Trash2, Award, Crown } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserVideos } from '@/hooks/useUserVideos';
import { useLikeVideo, useRateVideo } from '@/hooks/useVideos';
import { useDeleteVideo } from '@/hooks/useDeleteVideo';
import { useAuth } from '@/components/AuthWrapper';
import { useAchievementStats, useUserAchievements } from '@/hooks/useAchievements';
import { useAchievementTriggers } from '@/hooks/useAchievementTriggers';
import { Loader2 } from 'lucide-react';
import VideoCard from './VideoCard';
import DeleteVideoDialog from './DeleteVideoDialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Profile: React.FC = () => {
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: userVideos, isLoading: videosLoading } = useUserVideos();
  const { data: achievementStats } = useAchievementStats();
  const { data: userAchievements } = useUserAchievements();
  const { user } = useAuth();
  const likeVideoMutation = useLikeVideo();
  const rateVideoMutation = useRateVideo();
  const deleteVideoMutation = useDeleteVideo();
  const { triggerLikeReceived, triggerViewsReceived, triggerRatingReceived } = useAchievementTriggers();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<{id: string, title: string} | null>(null);

  // Update achievements when user stats change
  useEffect(() => {
    if (userProfile && user) {
      // Update achievements based on current stats
      triggerLikeReceived(userProfile.total_likes || 0);
      triggerViewsReceived(userProfile.total_views || 0);
      
      // Calculate average rating and total ratings
      if (userVideos && userVideos.length > 0) {
        const totalRatings = userVideos.reduce((sum, video) => sum + (video.comments_count || 0), 0);
        const avgRating = userVideos.reduce((sum, video) => sum + (video.average_rating || 0), 0) / userVideos.length;
        
        triggerRatingReceived(totalRatings, avgRating);
      }
    }
  }, [userProfile, userVideos, user]);

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast.error('Войдите в систему, чтобы ставить лайки');
      return;
    }

    const video = userVideos?.find(v => v.id === videoId);
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

  const recentAchievements = userAchievements?.filter(ua => ua.is_completed).slice(-3) || [];

  return (
    <div className="pb-16">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
        <div className="flex items-center mb-2">
          <img
            src={displayUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
            alt={displayUser.username || 'Роллер'}
            className="w-12 h-12 rounded-full border-2 border-white mr-2"
          />
          <div className="flex-1">
            <h2 className="text-lg font-bold">
              {displayUser.username || displayUser.telegram_username || 'Роллер'}
            </h2>
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

        {/* Winner Badge */}
        {(userProfile?.wins_count || 0) > 0 && (
          <div className="mt-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Crown className="w-4 h-4" />
              <span className="font-bold text-sm">
                {userProfile?.wins_count === 1 ? 'Победитель дня' : 
                 userProfile?.wins_count && userProfile.wins_count < 5 ? 'Чемпион' : 
                 'Легенда роллеров'}
              </span>
              <Crown className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

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

        {/* Achievement Section */}
        {achievementStats && (
          <div className="bg-white rounded-lg shadow-md p-2 mb-3">
            <h3 className="text-base font-semibold mb-2 flex items-center">
              <Award className="w-4 h-4 mr-2 text-purple-500" />
              Достижения
            </h3>
            
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-purple-50 rounded-lg p-2">
                <div className="text-base font-bold text-purple-600">{achievementStats.completed}</div>
                <div className="text-xs text-purple-700">Получено</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <div className="text-base font-bold text-blue-600">{achievementStats.remaining}</div>
                <div className="text-xs text-blue-700">Осталось</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-2">
                <div className="text-base font-bold text-orange-600">{achievementStats.completionRate}%</div>
                <div className="text-xs text-orange-700">Прогресс</div>
              </div>
            </div>

            {recentAchievements.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Последние достижения:</h4>
                <div className="space-y-1">
                  {recentAchievements.map(ua => (
                    <div key={ua.id} className="flex items-center text-xs bg-yellow-50 rounded p-1">
                      <span className="mr-2">{ua.achievement.icon}</span>
                      <span className="flex-1 text-gray-700">{ua.achievement.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        +{ua.achievement.reward_points}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

      <DeleteVideoDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteVideoMutation.isPending}
        videoTitle={videoToDelete?.title || ''}
      />
    </div>
  );
};

export default Profile;
