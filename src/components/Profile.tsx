
import React from 'react';
import { Calendar, Trophy, Video } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserVideos } from '@/hooks/useUserVideos';
import { useLikeVideo, useRateVideo } from '@/hooks/useVideos';
import { useAuth } from '@/components/AuthWrapper';
import { Loader2 } from 'lucide-react';
import VideoCard from './VideoCard';
import { toast } from 'sonner';

const Profile: React.FC = () => {
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: userVideos, isLoading: videosLoading } = useUserVideos();
  const { user } = useAuth();
  const likeVideoMutation = useLikeVideo();
  const rateVideoMutation = useRateVideo();

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

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] pb-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Используем данные из userProfile или fallback на данные из user
  const displayUser = userProfile || user;

  if (!displayUser) {
    return (
      <div className="p-4 pb-20">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Не удалось загрузить профиль
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center mb-4">
          <img
            src={displayUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
            alt={displayUser.username || 'Роллер'}
            className="w-20 h-20 rounded-full border-4 border-white mr-4"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {displayUser.username || displayUser.telegram_username || 'Роллер'}
            </h2>
            {displayUser.first_name && displayUser.last_name && (
              <p className="text-blue-100 text-lg">
                {displayUser.first_name} {displayUser.last_name}
              </p>
            )}
            <div className="flex items-center mt-1 text-blue-100">
              <Calendar className="w-4 h-4 mr-1" />
              <span className="text-sm">
                В Roller Tricks с {new Date(userProfile?.created_at || Date.now()).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{userProfile?.total_points || 0}</div>
            <div className="text-sm opacity-90">Баллов</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{userProfile?.wins_count || 0}</div>
            <div className="text-sm opacity-90">Побед</div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Статистика
          </h3>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">{userProfile?.total_videos || 0}</div>
              <div className="text-sm text-gray-600">Трюков</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-500">{userProfile?.total_likes || 0}</div>
              <div className="text-sm text-gray-600">Лайков</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-500">{userProfile?.total_views || 0}</div>
              <div className="text-sm text-gray-600">Просмотров</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Уровень:</span>
              <span className="font-bold text-orange-600">
                {(userProfile?.total_points || 0) < 100 ? 'Новичок' :
                 (userProfile?.total_points || 0) < 500 ? 'Любитель' :
                 (userProfile?.total_points || 0) < 1000 ? 'Мастер' : 'Профи'}
              </span>
            </div>
          </div>
        </div>

        {userProfile?.is_premium && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold mb-2">⭐ Premium статус</h3>
            <p className="text-sm opacity-90">
              У вас есть доступ к эксклюзивным функциям!
            </p>
          </div>
        )}

        {/* Video Feed Section */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Video className="w-5 h-5 mr-2 text-purple-500" />
            Мои трюки ({userProfile?.total_videos || 0})
          </h3>
          
          {videosLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (userProfile?.total_videos || 0) === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>У вас пока нет загруженных трюков</p>
              <p className="text-sm mt-2">Загрузите свой первый трюк во вкладке "Загрузить"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userVideos?.map(video => (
                <VideoCard
                  key={video.id}
                  video={{
                    id: video.id,
                    title: video.title,
                    author: displayUser.username || displayUser.telegram_username || 'Роллер',
                    authorAvatar: displayUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
                    thumbnail: video.thumbnail_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
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
                  }}
                  onLike={handleLike}
                  onRate={handleRate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
