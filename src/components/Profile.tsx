
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-gray-600">Профиль не найден</p>
        </div>
      </div>
    );
  }

  const completedAchievements = achievements?.filter(a => a.is_completed) || [];
  const totalAchievements = achievements?.length || 0;
  const achievementProgress = totalAchievements > 0 ? (completedAchievements.length / totalAchievements) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Заголовок профиля */}
        <Card className="mb-6 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24 ring-4 ring-blue-100">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {profile.username?.[0]?.toUpperCase() || profile.first_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {profile.first_name && profile.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : profile.username || 'Пользователь'
                    }
                  </h1>
                  
                  {/* Кнопки управления */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryDialogOpen(true)}
                      className="h-9 w-9 rounded-full border-2 hover:bg-blue-50 hover:border-blue-300 transition-all"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettingsDialogOpen(true)}
                      className="h-9 w-9 rounded-full border-2 hover:bg-purple-50 hover:border-purple-300 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {profile.username && (
                  <p className="text-gray-500 mb-2 font-medium">@{profile.username}</p>
                )}
                
                {profile.city && (
                  <p className="text-gray-600 mb-3 flex items-center">
                    <span className="mr-1">📍</span> {profile.city}
                  </p>
                )}
                
                {profile.sport_category && (
                  <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-0">
                    {profile.sport_category}
                  </Badge>
                )}

                {/* Статистика */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">{profile.total_points}</div>
                    <div className="text-sm opacity-90">Баллы</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">{profile.wins_count}</div>
                    <div className="text-sm opacity-90">Победы</div>
                  </div>
                </div>

                {/* Кнопки действий */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawalDialogOpen(true)}
                    className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Вывод
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMarketDialogOpen(true)}
                    className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Магазин
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Статистические карточки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="shadow-md border-0 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{profile.total_videos}</div>
              <div className="text-sm text-gray-600 font-medium">Видео</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-0 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{profile.total_likes}</div>
              <div className="text-sm text-gray-600 font-medium">Лайки</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-0 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{profile.total_views}</div>
              <div className="text-sm text-gray-600 font-medium">Просмотры</div>
            </CardContent>
          </Card>
        </div>

        {/* Прогресс достижений */}
        <Card className="mb-6 shadow-md border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-800">Достижения</span>
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {completedAchievements.length} из {totalAchievements}
                  </span>
                </div>
                <Progress value={achievementProgress} className="h-3" />
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Прогресс выполнения: <span className="font-semibold">{Math.round(achievementProgress)}%</span>
            </p>
          </CardContent>
        </Card>

        {/* Табы с контентом */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/90 backdrop-blur-sm shadow-md border-0">
            <TabsTrigger value="videos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Мои видео
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Достижения
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="space-y-4 mt-6">
            {videosLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Загрузка видео...</p>
              </div>
            ) : !videos || videos.length === 0 ? (
              <Card className="shadow-md border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 text-lg mb-2">Пока нет загруженных видео</p>
                  <p className="text-gray-400">Загрузите свое первое видео!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          
          <TabsContent value="achievements" className="space-y-4 mt-6">
            {achievementsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Загрузка достижений...</p>
              </div>
            ) : !achievements || achievements.length === 0 ? (
              <Card className="shadow-md border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 text-lg">Достижения не найдены</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white flex justify-between items-center">
                <h2 className="text-2xl font-bold">Магазин</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setMarketDialogOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
                <Market />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
