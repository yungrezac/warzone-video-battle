
import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserVideos } from '@/hooks/useUserVideos';
import { useUserAchievements } from '@/hooks/useAchievements';
import { useLikeVideo, useRateVideo } from '@/hooks/useVideos';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VideoCard from '@/components/VideoCard';
import AchievementCard from '@/components/AchievementCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PointsHistoryDialog } from '@/components/PointsHistoryDialog';
import { NotificationSettingsDialog } from '@/components/NotificationSettingsDialog';
import { WithdrawalDialog } from '@/components/WithdrawalDialog';
import Market from '@/components/Market';
import { toast } from 'sonner';
import { 
  Trophy, 
  Heart, 
  Eye, 
  Video, 
  History,
  Settings,
  Download,
  ShoppingBag
} from 'lucide-react';

const Profile = () => {
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: videos, isLoading: videosLoading } = useUserVideos();
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements();
  const likeVideoMutation = useLikeVideo();
  const rateVideoMutation = useRateVideo();
  
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [marketDialogOpen, setMarketDialogOpen] = useState(false);

  const handleLike = async (videoId: string) => {
    const video = videos?.find(v => v.id === videoId);
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Загрузка профиля...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Профиль не найден</div>
      </div>
    );
  }

  const completedAchievements = achievements?.filter(a => a.is_completed) || [];
  const totalAchievements = achievements?.length || 0;
  const achievementProgress = totalAchievements > 0 ? (completedAchievements.length / totalAchievements) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Заголовок профиля */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-lg">
                {profile.username?.[0]?.toUpperCase() || profile.first_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">
                  {profile.first_name && profile.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile.username || 'Пользователь'
                  }
                </h1>
                
                {/* Кнопки История и Настройки */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryDialogOpen(true)}
                  className="h-8"
                >
                  <History className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsDialogOpen(true)}
                  className="h-8"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              
              {profile.username && (
                <p className="text-gray-600 mb-2">@{profile.username}</p>
              )}
              
              {profile.city && (
                <p className="text-gray-500 mb-2">📍 {profile.city}</p>
              )}
              
              {profile.sport_category && (
                <Badge variant="secondary" className="mb-3">
                  {profile.sport_category}
                </Badge>
              )}

              {/* Статистика */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{profile.total_points}</div>
                  <div className="text-sm text-gray-600">Баллы</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{profile.wins_count}</div>
                  <div className="text-sm text-gray-600">Победы</div>
                </div>
              </div>

              {/* Кнопки Вывод и Магазин */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWithdrawalDialogOpen(true)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Вывод
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMarketDialogOpen(true)}
                  className="flex-1"
                >
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  Магазин
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Остальной контент профиля */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Video className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{profile.total_videos}</div>
            <div className="text-sm text-gray-600">Видео</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">{profile.total_likes}</div>
            <div className="text-sm text-gray-600">Лайки</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{profile.total_views}</div>
            <div className="text-sm text-gray-600">Просмотры</div>
          </CardContent>
        </Card>
      </div>

      {/* Прогресс достижений */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold">Достижения</span>
                <span className="text-sm text-gray-600">
                  {completedAchievements.length} из {totalAchievements}
                </span>
              </div>
              <Progress value={achievementProgress} className="h-2" />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Прогресс выполнения достижений: {Math.round(achievementProgress)}%
          </p>
        </CardContent>
      </Card>

      {/* Табы с контентом */}
      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="videos">Мои видео</TabsTrigger>
          <TabsTrigger value="achievements">Достижения</TabsTrigger>
        </TabsList>
        
        <TabsContent value="videos" className="space-y-4">
          {videosLoading ? (
            <div className="text-center py-8">Загрузка видео...</div>
          ) : !videos || videos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Пока нет загруженных видео
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={{
                    id: video.id,
                    title: video.title,
                    author: profile.username || profile.first_name || 'Пользователь',
                    authorAvatar: profile.avatar_url || '',
                    thumbnail: video.thumbnail_url || '',
                    videoUrl: video.video_url,
                    likes: video.likes_count || 0,
                    comments: video.comments_count || 0,
                    rating: video.average_rating || 0,
                    views: video.views || 0,
                    isWinner: video.is_winner || false,
                    timestamp: new Date(video.created_at).toLocaleString('ru-RU'),
                    userLiked: video.user_liked || false,
                    userRating: video.user_rating || 0,
                  }}
                  onLike={handleLike}
                  onRate={handleRate}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="achievements" className="space-y-4">
          {achievementsLoading ? (
            <div className="text-center py-8">Загрузка достижений...</div>
          ) : !achievements || achievements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Достижения не найдены
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((userAchievement) => (
                <AchievementCard
                  key={userAchievement.id}
                  userAchievement={userAchievement}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Диалоги */}
      <PointsHistoryDialog 
        open={historyDialogOpen} 
        onOpenChange={setHistoryDialogOpen} 
      />
      
      <NotificationSettingsDialog 
        open={settingsDialogOpen} 
        onOpenChange={setSettingsDialogOpen} 
      />
      
      <WithdrawalDialog 
        open={withdrawalDialogOpen} 
        onOpenChange={setWithdrawalDialogOpen} 
      />

      {/* Диалог магазина */}
      {marketDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Магазин</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setMarketDialogOpen(false)}
              >
                ✕
              </Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <Market />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
