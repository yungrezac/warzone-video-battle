
import React from 'react';
import { Trophy, Crown, Award, Star } from 'lucide-react';
import { useGetDailyWinner } from '@/hooks/useWinnerSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface WinnerAnnouncementProps {
  date?: string;
  showTitle?: boolean;
}

const WinnerAnnouncement: React.FC<WinnerAnnouncementProps> = ({ 
  date, 
  showTitle = true 
}) => {
  const { data: winner, isLoading } = useGetDailyWinner(date);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
        <CardContent className="p-4 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!winner) {
    return (
      <Card className="bg-gradient-to-r from-gray-400 to-gray-500 text-white">
        <CardContent className="p-4 text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-70" />
          <p className="text-sm">Победитель дня еще не определен</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
      <CardHeader className="pb-2">
        {showTitle && (
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Crown className="w-5 h-5" />
            Победитель дня
            <Crown className="w-5 h-5" />
          </CardTitle>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={winner.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
              alt={winner.profiles?.username || 'Победитель'}
              className="w-12 h-12 rounded-full border-2 border-white"
            />
            <div className="absolute -top-1 -right-1 bg-yellow-300 rounded-full p-1">
              <Trophy className="w-3 h-3 text-yellow-800" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white">
                {winner.profiles?.username || 'Роллер'}
              </h3>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                +100 баллов
              </Badge>
            </div>
            <p className="text-sm text-yellow-100 mb-1">
              {winner.title}
            </p>
            <div className="flex items-center gap-3 text-xs text-yellow-100">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {winner.likes_count || 0} лайков
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                {(winner.average_rating || 0).toFixed(1)} рейтинг
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WinnerAnnouncement;
