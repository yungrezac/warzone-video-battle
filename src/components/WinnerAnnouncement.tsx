
import React from 'react';
import { Crown, Trophy, Heart, Star, Eye } from 'lucide-react';
import { useYesterdayWinner, useTopUsers } from '@/hooks/useWinnerSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface WinnerAnnouncementProps {
  onViewWinner?: (videoId: string) => void;
}

const WinnerAnnouncement: React.FC<WinnerAnnouncementProps> = ({ onViewWinner }) => {
  const { data: winner, isLoading: winnerLoading } = useYesterdayWinner();
  const { data: topUsers, isLoading: topUsersLoading } = useTopUsers();

  if (winnerLoading) {
    return (
      <div className="p-2 mb-4">
        <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              <Skeleton className="h-5 w-32 bg-white/20" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full bg-white/20 rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!winner) {
    return (
      <div className="p-2 mb-4">
        <Card className="bg-gradient-to-r from-gray-400 to-gray-500 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Победитель вчерашнего дня
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-90">
              Пока нет победителя за вчерашний день
            </p>
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
      <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="w-5 h-5" />
            🏆 Победитель вчерашнего дня
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-3">
            <img 
              src={winnerUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face'} 
              alt={displayName}
              className="w-12 h-12 rounded-full border-2 border-white"
            />
            <div className="flex-1">
              <h3 className="font-bold text-white">{displayName}</h3>
              <p className="text-sm opacity-90 truncate">{winner.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm mb-3">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{winner.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>{(winner.average_rating || 0).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{winner.views || 0}</span>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              +100 баллов
            </Badge>
          </div>

          <Button 
            onClick={handleViewWinner}
            variant="secondary"
            size="sm"
            className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            👀 Посмотреть
          </Button>
        </CardContent>
      </Card>

      {/* Топ пользователей недели */}
      {!topUsersLoading && topUsers && topUsers.length > 0 && (
        <Card className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              🌟 Топ роллеров
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topUsers.slice(0, 3).map((userPoint, index) => {
                const user = userPoint.user;
                const userDisplayName = user?.username || user?.telegram_username || user?.first_name || 'Роллер';
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                
                return (
                  <div key={userPoint.id} className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{medal}</span>
                    <img 
                      src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=30&h=30&fit=crop&crop=face'} 
                      alt={userDisplayName}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="flex-1 truncate">{userDisplayName}</span>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                      {userPoint.total_points || 0} баллов
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
