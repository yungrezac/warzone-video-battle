
import React from 'react';
import { Search, Crown, Trophy, Users as UsersIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const UsersPage: React.FC = () => {
  const topUsers = [
    {
      id: 1,
      username: 'RollerKing',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
      points: 1250,
      wins: 15,
      rank: 1,
      isOnline: true
    },
    {
      id: 2,
      username: 'TrickMaster',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      points: 1180,
      wins: 12,
      rank: 2,
      isOnline: false
    },
    {
      id: 3,
      username: 'SkateQueen',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b286?w=100&h=100&fit=crop&crop=face',
      points: 1050,
      wins: 10,
      rank: 3,
      isOnline: true
    }
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-4 h-4 text-amber-600" />;
    return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">#{rank}</span>;
  };

  return (
    <div className="pb-16">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3">
        <h1 className="text-xl font-bold">Пользователи</h1>
        <p className="text-purple-100 text-sm">Рейтинг и статистика роллеров</p>
      </div>

      <div className="p-3">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Поиск пользователей..."
            className="pl-10"
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Топ роллеры</h2>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            <UsersIcon className="w-3 h-3 mr-1" />
            {topUsers.length} активных
          </Badge>
        </div>

        <div className="space-y-3">
          {topUsers.map(user => (
            <Card key={user.id} className="p-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getRankIcon(user.rank)}
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-10 h-10 rounded-full"
                    />
                    {user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{user.username}</h3>
                    {user.rank <= 3 && (
                      <Badge variant="secondary" className="text-xs">
                        TOP {user.rank}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>{user.points} баллов</span>
                    <span>{user.wins} побед</span>
                    {user.isOnline && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Online
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h3 className="font-semibold mb-2">Статистика сообщества</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">1,247</div>
              <div className="text-xs text-gray-600">Активных пользователей</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">89</div>
              <div className="text-xs text-gray-600">Онлайн сейчас</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
