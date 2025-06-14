
import React from 'react';
import { Calendar, Trophy, Video, ArrowLeft, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRateVideo } from '@/hooks/useVideos';
import { useLikeVideo } from '@/hooks/useVideoLikes';
import { useAuth } from '@/components/AuthWrapper';
import { useOtherUserProfile } from '@/hooks/useOtherUserProfile';
import { Loader2 } from 'lucide-react';
import VideoCard from '@/components/VideoCard';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface FullScreenUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const FullScreenUserProfileModal: React.FC<FullScreenUserProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  userId 
}) => {
  const { user } = useAuth();
  const likeVideoMutation = useLikeVideo();
  const rateVideoMutation = useRateVideo();
  
  const { data: userProfile, isLoading: profileLoading } = useOtherUserProfile(userId);

  const { data: userVideos, isLoading: videosLoading } = useQuery({
    queryKey: ['user-videos', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const videosWithStats = await Promise.all(
        (videos || []).map(async (video) => {
          const { count: likesCount } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          const { count: commentsCount } = await supabase
            .from('video_comments')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          const { data: ratings } = await supabase
            .from('video_ratings')
            .select('rating')
            .eq('video_id', video.id);

          const averageRating = ratings && ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

          let userLiked = false;
          let userRating = 0;

          if (user?.id) {
            const { data: userLike } = await supabase
              .from('video_likes')
              .select('*')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .maybeSingle();

            userLiked = !!userLike;

            const { data: userRatingData } = await supabase
              .from('video_ratings')
              .select('rating')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .maybeSingle();

            userRating = userRatingData?.rating || 0;
          }

          return {
            ...video,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            average_rating: Number(averageRating.toFixed(1)),
            user_liked: userLiked,
            user_rating: userRating,
            thumbnail_url: video.thumbnail_url || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
          };
        })
      );

      return videosWithStats;
    },
    enabled: !!userId && isOpen,
  });

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast.error('Войдите в систему, чтобы ставить лайки');
      return;
    }

    const video = userVideos?.find(v => v.id === videoId);
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

  if (profileLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full h-full max-w-none max-h-none m-0 p-0 rounded-none" hideCloseButton>
          <div className="min-h-screen bg-gray-50 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!userProfile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full h-full max-w-none max-h-none m-0 p-0 rounded-none" hideCloseButton>
          <div className="min-h-screen bg-gray-50 p-3">
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              Профиль не найден
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none max-h-none m-0 p-0 rounded-none" hideCloseButton>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Header with back button */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 mr-2 p-1"
              onClick={onClose}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-bold">Профиль</h1>
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
                  <h2 className="text-lg font-bold">
                    {userProfile.username || userProfile.telegram_username || 'Роллер'}
                  </h2>
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

            {/* Stats and Achievements */}
            <div className="p-3">
              <div className="bg-white rounded-lg shadow-md p-3 mb-3">
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

              {/* Achievements Section */}
              <div className="bg-white rounded-lg shadow-md p-3 mb-3">
                <h3 className="text-base font-semibold mb-2 flex items-center">
                  <Award className="w-4 h-4 mr-2 text-purple-500" />
                  Достижения
                </h3>
                
                <div className="grid grid-cols-2 gap-2 text-center mb-3">
                  <div className="bg-purple-50 rounded-lg p-2">
                    <div className="text-base font-bold text-purple-600">{userProfile?.total_achievements || 0}</div>
                    <div className="text-xs text-purple-700">Получено</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <div className="text-base font-bold text-blue-600">{userProfile?.total_points || 0}</div>
                    <div className="text-xs text-blue-700">Очков за достижения</div>
                  </div>
                </div>

                {userProfile.recent_achievements && userProfile.recent_achievements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Последние достижения:</h4>
                    <div className="space-y-1">
                      {userProfile.recent_achievements.map((ua: any) => (
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

              {userProfile?.is_premium && (
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-3 mb-3">
                  <h3 className="text-base font-bold mb-1">⭐ Premium статус</h3>
                  <p className="text-sm opacity-90">
                    У пользователя есть доступ к эксклюзивным функциям!
                  </p>
                </div>
              )}

              {/* Video Feed Section */}
              <div className="bg-white rounded-lg shadow-md p-3">
                <h3 className="text-base font-semibold mb-2 flex items-center">
                  <Video className="w-4 h-4 mr-2 text-purple-500" />
                  Трюки ({userProfile?.total_videos || 0})
                </h3>
                
                {videosLoading ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (userProfile?.total_videos || 0) === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">У пользователя пока нет загруженных трюков</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userVideos?.map(video => (
                      <VideoCard
                        key={video.id}
                        video={{
                          id: video.id,
                          title: video.title,
                          author: userProfile.username || userProfile.telegram_username || 'Роллер',
                          authorAvatar: userProfile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullScreenUserProfileModal;
