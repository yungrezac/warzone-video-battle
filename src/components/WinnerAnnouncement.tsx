
import React from 'react';
import { Crown, Trophy, Heart, Star, Eye, Calendar, MessageCircle } from 'lucide-react';
import { useYesterdayWinner, useTodayWinner, useTopUsers } from '@/hooks/useWinnerSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface WinnerAnnouncementProps {
  onViewWinner?: (videoId: string) => void;
}

const WinnerAnnouncement: React.FC<WinnerAnnouncementProps> = ({ onViewWinner }) => {
  const { data: yesterdayWinner, isLoading: yesterdayLoading } = useYesterdayWinner();
  const { data: todayWinner, isLoading: todayLoading } = useTodayWinner();
  const { data: topUsers, isLoading: topUsersLoading } = useTopUsers();

  // Определяем какого победителя показывать
  const winner = todayWinner || yesterdayWinner;
  const isLoading = todayLoading || yesterdayLoading;
  const isToday = !!todayWinner;

  if (isLoading) {
    return (
      <div className="p-2 mb-4">
        <Card className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 animate-pulse" />
              <Skeleton className="h-6 w-48 bg-white/20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-14 h-14 rounded-full bg-white/20" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 bg-white/20" />
                <Skeleton className="h-3 w-48 bg-white/20" />
              </div>
            </div>
            <Skeleton className="h-8 w-full bg-white/20 rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!winner) {
    return (
      <div className="p-2 mb-4">
        <Card className="bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-lg border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              🏆 Победитель дня
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <Crown className="w-12 h-12 mx-auto mb-3 opacity-60" />
              <p className="text-base font-medium mb-2">
                Пока нет победителя
              </p>
              <p className="text-sm opacity-80">
                Победитель определяется автоматически по формуле: лайки × 3 + рейтинг × 10 + просмотры × 0.1
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const winnerUser = winner.user;
  const displayName = winnerUser?.username || winnerUser?.telegram_username || winnerUser?.first_name || 'Роллер';

  const handleViewWinner = () => {
    if (onViewWinner && winner.id) {
      onViewWinner(winner.id);
    }
  };

  return (
    <div className="p-2 mb-4">
      <Card className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white border-0 shadow-xl relative overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="w-6 h-6 drop-shadow-lg" />
            🏆 {isToday ? 'Победитель сегодня' : 'Победитель вчерашнего дня'}
            {isToday && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/50 text-xs">
                До 23:59
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <img 
                src={winnerUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face'} 
                alt={displayName}
                className="w-14 h-14 rounded-full border-3 border-white shadow-lg"
              />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-yellow-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg drop-shadow-sm">{displayName}</h3>
              <p className="text-sm opacity-90 truncate font-medium">{winner.title}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-center mb-4">
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
              <Heart className="w-4 h-4 mx-auto mb-1" />
              <span className="text-sm font-bold">{(winner as any).likes_count || winner.likes_count || 0}</span>
            </div>
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
              <Star className="w-4 h-4 mx-auto mb-1" />
              <span className="text-sm font-bold">{((winner as any).average_rating || winner.average_rating || 0).toFixed ? ((winner as any).average_rating || winner.average_rating || 0).toFixed(1) : 0}</span>
            </div>
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
              <MessageCircle className="w-4 h-4 mx-auto mb-1" />
              <span className="text-sm font-bold">{(winner as any).comments_count || 0}</span>
            </div>
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
              <Eye className="w-4 h-4 mx-auto mb-1" />
              <span className="text-sm font-bold">{winner.views || 0}</span>
            </div>
          </div>

          <Button 
            onClick={handleViewWinner}
            variant="secondary"
            size="sm"
            className="w-full bg-white text-yellow-600 hover:bg-white/90 font-bold shadow-lg border-0 transition-all duration-200 transform hover:scale-105"
          >
            👀 Посмотреть победное видео
          </Button>
        </CardContent>
      </Card>

      {/* Топ пользователей недели */}
      {!topUsersLoading && topUsers && topUsers.length > 0 && (
        <Card className="mt-3 bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              🌟 Топ роллеров всех времен
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUsers.slice(0, 3).map((userPoint, index) => {
                const user = userPoint.user;
                const userDisplayName = user?.username || user?.telegram_username || user?.first_name || 'Роллер';
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                const bgOpacity = index === 0 ? 'bg-white/30' : index === 1 ? 'bg-white/20' : 'bg-white/15';
                
                return (
                  <div key={userPoint.id} className={`flex items-center gap-3 text-sm p-2 rounded-lg ${bgOpacity} backdrop-blur-sm`}>
                    <span className="text-xl">{medal}</span>
                    <img 
                      src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=30&h=30&fit=crop&crop=face'} 
                      alt={userDisplayName}
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                    <span className="flex-1 truncate font-medium">{userDisplayName}</span>
                    <Badge variant="secondary" className="bg-white/30 text-white border-white/50 text-xs font-bold">
                      {userPoint.total_points || 0}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WinnerAnnouncement;
