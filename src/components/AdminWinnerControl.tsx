
import React, { useState } from 'react';
import { Crown, Calendar, Trophy, Users } from 'lucide-react';
import { useCalculateDailyWinner, useGetWeeklyLeaderboard } from '@/hooks/useWinnerSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AdminWinnerControl: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  const calculateWinnerMutation = useCalculateDailyWinner();
  const { data: leaderboard, isLoading: leaderboardLoading } = useGetWeeklyLeaderboard();

  const handleCalculateWinner = async () => {
    try {
      const result = await calculateWinnerMutation.mutateAsync(selectedDate);
      toast.success(`Победитель определен: ${result.profiles?.username}`);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при определении победителя');
    }
  };

  return (
    <div className="space-y-4">
      {/* Управление победителем дня */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Определить победителя дня
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <Button
            onClick={handleCalculateWinner}
            disabled={calculateWinnerMutation.isPending}
            className="w-full bg-yellow-500 hover:bg-yellow-600"
          >
            {calculateWinnerMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Определяем...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                Определить победителя
              </>
            )}
          </Button>
          
          <div className="text-xs text-gray-600">
            <p>• Победитель определяется по формуле: лайки × 3 + рейтинг × 10 + просмотры × 0.1</p>
            <p>• Победитель получает +100 баллов и достижение</p>
          </div>
        </CardContent>
      </Card>

      {/* Недельный лидерборд */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Топ роллеров недели
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboardLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((user: any, index: number) => (
                <div
                  key={user.user_id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                    index === 1 ? 'bg-gray-50 border border-gray-200' :
                    index === 2 ? 'bg-orange-50 border border-orange-200' :
                    'bg-gray-25'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-500 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-gray-300 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    <img
                      src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-sm">{user.username}</p>
                      <p className="text-xs text-gray-500">
                        {user.video_count} видео
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(user.score)} pts
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {user.total_likes} ❤️ {Math.round(user.total_rating / user.video_count * 10) / 10} ⭐
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              Нет данных за последнюю неделю
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWinnerControl;
