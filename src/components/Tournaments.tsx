
import React, { useState } from 'react';
import { Trophy, Calendar, DollarSign, Crown, Upload, Video, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SubscriptionModal from './SubscriptionModal';
import VideoCard from './VideoCard';

const Tournaments: React.FC = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

  // Получаем список турниров
  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Получаем видео турниров с профилями пользователей
  const { data: tournamentVideos, isLoading: videosLoading } = useQuery({
    queryKey: ['tournament-videos', selectedTournament],
    queryFn: async () => {
      if (!selectedTournament) return [];

      const { data: videos, error } = await supabase
        .from('tournament_videos')
        .select('*')
        .eq('tournament_id', selectedTournament)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Получаем профили пользователей отдельно
      if (videos && videos.length > 0) {
        const userIds = videos.map(v => v.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, telegram_username, avatar_url')
          .in('id', userIds);

        // Объединяем данные
        return videos.map(video => ({
          ...video,
          profile: profiles?.find(p => p.id === video.user_id)
        }));
      }

      return videos || [];
    },
    enabled: !!selectedTournament,
  });

  if (!isPremium) {
    return (
      <div className="p-3 pb-16">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-3 rounded-lg mb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Турниры
              </h1>
              <p className="text-sm opacity-90">Денежные призы до 100,000₽</p>
            </div>
            <Crown className="w-8 h-8 opacity-80" />
          </div>
        </div>

        {/* Premium Required */}
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-yellow-700">
              <Crown className="w-6 h-6" />
              Premium доступ требуется
            </CardTitle>
            <CardDescription>
              Участие в турнирах доступно только с Premium подпиской
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-800">Что вы получите:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Участие в денежных турнирах
                </li>
                <li className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Призы до 100,000₽
                </li>
                <li className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-500" />
                  Загрузка видео для турниров
                </li>
              </ul>
            </div>

            <SubscriptionModal>
              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                <Crown className="w-4 h-4 mr-2" />
                Получить Premium за 300 ⭐
              </Button>
            </SubscriptionModal>
          </CardContent>
        </Card>

        {/* Public Tournament Videos */}
        {tournaments && tournaments.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold mb-3 flex items-center">
              <Video className="w-5 h-5 mr-2" />
              Видео турниров
            </h2>
            
            <div className="space-y-3">
              {tournaments.slice(0, 3).map(tournament => (
                <Card key={tournament.id} className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{tournament.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>Приз: {tournament.prize_amount.toLocaleString('ru-RU')}₽</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Видео участников турнира (только просмотр)
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-lg mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Турниры
            </h1>
            <p className="text-sm opacity-90">Участвуйте и выигрывайте призы!</p>
          </div>
          <Badge className="bg-white bg-opacity-20">
            <Crown className="w-4 h-4 mr-1" />
            Premium
          </Badge>
        </div>
      </div>

      {/* Tournaments List */}
      {tournamentsLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : tournaments && tournaments.length > 0 ? (
        <div className="space-y-3 mb-6">
          {tournaments.map(tournament => (
            <Card 
              key={tournament.id} 
              className={`border-2 cursor-pointer transition-colors ${
                selectedTournament === tournament.id 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => setSelectedTournament(tournament.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{tournament.title}</CardTitle>
                    <CardDescription>{tournament.description}</CardDescription>
                  </div>
                  <Badge 
                    variant={tournament.status === 'active' ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {tournament.status === 'active' ? 'Активный' : 'Завершен'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {tournament.prize_amount.toLocaleString('ru-RU')}₽
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">
                        До {new Date(tournament.end_date).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{tournament.participants_count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Активных турниров пока нет</p>
          </CardContent>
        </Card>
      )}

      {/* Tournament Videos */}
      {selectedTournament && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Видео участников</h2>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Upload className="w-4 h-4 mr-2" />
              Загрузить видео
            </Button>
          </div>

          {videosLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : tournamentVideos && tournamentVideos.length > 0 ? (
            <div className="space-y-3">
              {tournamentVideos.map(video => (
                <VideoCard
                  key={video.id}
                  video={{
                    id: video.id,
                    title: video.title,
                    author: video.profile?.username || video.profile?.telegram_username || 'Участник',
                    authorAvatar: video.profile?.avatar_url || '',
                    thumbnail: video.thumbnail_url || '',
                    videoUrl: video.video_url,
                    likes: 0,
                    comments: 0,
                    rating: 0,
                    views: video.views || 0,
                    isWinner: video.is_winner || false,
                    timestamp: new Date(video.created_at).toLocaleString('ru-RU'),
                    userLiked: false,
                    userRating: 0,
                  }}
                  onLike={() => {}}
                  onRate={() => {}}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-6">
                <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Видео пока не загружены</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Tournaments;
