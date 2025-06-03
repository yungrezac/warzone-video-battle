
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Trophy, Video, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLikeVideo, useRateVideo } from '@/hooks/useVideos';
import { useAuth } from '@/components/AuthWrapper';
import { Loader2 } from 'lucide-react';
import VideoCard from '@/components/VideoCard';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const likeVideoMutation = useLikeVideo();
  const rateVideoMutation = useRateVideo();

  // Получаем профиль пользователя
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_points (
            total_points,
            wins_count
          )
        `)
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const { data: userVideos, error: videosError } = await supabase
        .from('videos')
        .select('id')
        .eq('user_id', userId);

      if (videosError) throw videosError;

      const videoIds = userVideos?.map(v => v.id) || [];
      const totalVideos = videoIds.length;

      let totalLikes = 0;
      let totalViews = 0;

      if (videoIds.length > 0) {
        const { count: likesCount } = await supabase
          .from('video_likes')
          .select('*', { count: 'exact' })
          .in('video_id', videoIds);

        totalLikes = likesCount || 0;

        const { data: viewsData } = await supabase
          .from('videos')
          .select('views')
          .eq('user_id', userId);

        totalViews = viewsData?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;
      }

      const userPoints = profile.user_points?.[0];

      return {
        ...profile,
        total_points: userPoints?.total_points || 0,
        wins_count: userPoints?.wins_count || 0,
        total_videos: totalVideos,
        total_likes: totalLikes,
        total_views: totalViews,
        videos: userVideos || [],
      };
    },
    enabled: !!userId,
  });

  // Получаем видео пользователя
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
            thumbnail_url: video.thumbnail_url || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
          };
        })
      );

      return videosWithStats;
    },
    enabled: !!userId,
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
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-3">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          Профиль не найден
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sticky top-0 z-40">
        <div className="flex items-center">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 mr-2 p-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Профиль</h1>
        </div>
      </div>

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

      {/* Stats Section */}
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
                    thumbnail: video.thumbnail_url || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
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

export default UserProfile;
