
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Trophy, Video, ArrowLeft, Award, UserPlus, BellRing, Heart, ThumbsUp, Eye, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOtherUserProfile } from '@/hooks/useOtherUserProfile';
import VideoCard from '@/components/VideoCard';
import AchievementCard from '@/components/AchievementCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthWrapper';
import { useLikeVideo } from '@/hooks/useVideoLikes';
import { toast } from 'sonner';
import PremiumBadge from '@/components/PremiumBadge';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { useUserVideos } from '@/hooks/useUserVideos';
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
import { Badge } from '@/components/ui/badge';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const likeVideoMutation = useLikeVideo();
  const { t, i18n } = useTranslation();
  const { isSubscribed, subscribe, unsubscribe, isLoading } = useUserSubscriptions(userId || null);
  const [showSubscribeConfirm, setShowSubscribeConfirm] = useState(false);

  const { data: userProfile, isLoading: profileLoading } = useOtherUserProfile(userId || null);
  const { data: userVideos, isLoading: videosLoading } = useUserVideos(userId || null);

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast.error(t('login_to_like'));
      return;
    }
    const video = userVideos?.find(v => v.id === videoId);
    if (!video) return;

    try {
      await likeVideoMutation.mutateAsync({ videoId, isLiked: video.user_liked || false });
    } catch (error) {
      console.error(t('like_error_log'), error);
      toast.error(t('like_error_toast'));
    }
  };

  const handleSubscribeClick = () => {
    if (!user) {
      toast.error(t('login_to_subscribe'));
      return;
    }
    if (isSubscribed) {
      unsubscribe();
    } else {
      setShowSubscribeConfirm(true);
    }
  };

  const confirmSubscription = () => {
    subscribe();
    setShowSubscribeConfirm(false);
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
          {t('user_profile_profile_not_found')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header with back button */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sticky top-0 z-40">
        <div className="flex items-center">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 mr-2 p-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">{t('user_profile_title')}</h1>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
        <div className="flex items-start mb-3">
          <img
            src={userProfile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
            alt={userProfile.username || t('skater')}
            className="w-12 h-12 rounded-full border-2 border-white mr-3"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">
                {userProfile.username || userProfile.telegram_username || t('skater')}
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
                {t('in_tricks_since', { date: new Date(userProfile?.created_at || Date.now()).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' }) })}
              </span>
            </div>
          </div>
          {user?.id !== userId && (
            <Button
              variant={isSubscribed ? 'secondary' : 'outline'}
              size="sm"
              onClick={handleSubscribeClick}
              className={`ml-auto ${isSubscribed ? '' : 'text-white border-white hover:bg-white/20 hover:text-white'}`}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UserPlus className="w-4 h-4 mr-2" />}
              {isSubscribed ? t('unsubscribe') : t('subscribe')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{userProfile?.followers_count || 0}</div>
            <div className="text-xs opacity-90">{t('followers')}</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{userProfile?.following_count || 0}</div>
            <div className="text-xs opacity-90">{t('following')}</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{userProfile?.wins_count || 0}</div>
            <div className="text-xs opacity-90">{t('wins')}</div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-3">
        <div className="bg-white rounded-lg shadow-md p-3 mb-3">
          <h3 className="text-base font-semibold mb-2 flex items-center">
            <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
            {t('statistics')}
          </h3>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-base font-bold text-blue-600">{userProfile?.total_videos || 0}</div>
              <div className="text-xs text-gray-600">{t('tricks')}</div>
            </div>
            <div>
              <div className="text-base font-bold text-red-500">{userProfile?.total_likes || 0}</div>
              <div className="text-xs text-gray-600">{t('likes_count')}</div>
            </div>
            <div>
              <div className="text-base font-bold text-green-500">{userProfile?.total_views || 0}</div>
              <div className="text-xs text-gray-600">{t('views')}</div>
            </div>
          </div>

          <div className="mt-2 p-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700 text-sm">{t('level')}</span>
              <span className="font-bold text-orange-600 text-sm">
                {(userProfile?.total_points || 0) < 100 ? t('level_beginner') :
                 (userProfile?.total_points || 0) < 500 ? t('level_amateur') :
                 (userProfile?.total_points || 0) < 1000 ? t('level_master') : t('level_pro')}
              </span>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-lg shadow-md p-3 mb-3">
          <h3 className="text-base font-semibold mb-2 flex items-center">
            <Award className="w-4 h-4 mr-2 text-purple-500" />
            {t('achievements')}
          </h3>
          
          <div className="grid grid-cols-2 gap-2 text-center mb-3">
            <div className="bg-purple-50 rounded-lg p-2">
              <div className="text-base font-bold text-purple-600">{userProfile?.total_achievements || 0}</div>
              <div className="text-xs text-purple-700">{t('user_profile_achievements_received')}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-base font-bold text-blue-600 points-display">{formatPoints(userProfile?.total_points || 0)}</div>
            </div>
          </div>

          {userProfile.recent_achievements && userProfile.recent_achievements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{t('user_profile_recent_achievements')}</h4>
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
            <h3 className="text-base font-bold mb-1">{t('premium_status_title')}</h3>
            <p className="text-sm opacity-90">
              {t('user_profile_premium_status_desc_other')}
            </p>
          </div>
        )}

        {/* Video Feed Section */}
        <div className="bg-white rounded-lg shadow-md p-3">
          <h3 className="text-base font-semibold mb-2 flex items-center">
            <Video className="w-4 h-4 mr-2 text-purple-500" />
            {t('user_profile_tricks_count', { count: userProfile?.total_videos || 0 })}
          </h3>
          
          {videosLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (userProfile?.total_videos || 0) === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">{t('user_profile_no_tricks')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userVideos?.map(video => (
                <VideoCard
                  key={video.id}
                  video={{
                    id: video.id,
                    title: video.title,
                    author: userProfile.username || userProfile.telegram_username || t('skater'),
                    authorAvatar: userProfile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
                    thumbnail: video.thumbnail_url || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
                    videoUrl: video.video_url,
                    likes: video.likes_count || 0,
                    comments: video.comments_count || 0,
                    views: video.views,
                    isWinner: video.is_winner,
                    timestamp: new Date(video.created_at).toLocaleString(i18n.language, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    }),
                    userLiked: video.user_liked || false,
                    authorIsPremium: userProfile.is_premium,
                    userId: video.user_id,
                    category: video.category as 'Rollers' | 'BMX' | 'Skateboard',
                  }}
                  onLike={handleLike}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showSubscribeConfirm} onOpenChange={setShowSubscribeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-yellow-500" />
              {t('subscription_confirmation_title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('subscription_confirmation_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubscription}>{t('subscribe')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserProfile;
