
import React, { useState } from 'react';
import { Search, Filter, Star, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  avatar: string;
  totalPoints: number;
  totalVideos: number;
  totalLikes: number;
  level: string;
  isOnline: boolean;
  wins: number;
}

const UsersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'top' | 'new'>('all');

  // Мок данные пользователей
  const users: User[] = [
    {
      id: '1',
      username: 'roller_pro',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
      totalPoints: 1250,
      totalVideos: 45,
      totalLikes: 892,
      level: 'Профи',
      isOnline: true,
      wins: 12
    },
    {
      id: '2',
      username: 'skate_master',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face',
      totalPoints: 980,
      totalVideos: 32,
      totalLikes: 654,
      level: 'Мастер',
      isOnline: false,
      wins: 8
    },
    {
      id: '3',
      username: 'trick_king',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      totalPoints: 756,
      totalVideos: 28,
      totalLikes: 423,
      level: 'Любитель',
      isOnline: true,
      wins: 5
    },
    {
      id: '4',
      username: 'urban_rider',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      totalPoints: 432,
      totalVideos: 18,
      totalLikes: 234,
      level: 'Новичок',
      isOnline: true,
      wins: 2
    }
  ];

  const filteredUsers = users
    .filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (filterType) {
        case 'top':
          return b.totalPoints - a.totalPoints;
        case 'new':
          return a.username.localeCompare(b.username);
        default:
          return b.totalPoints - a.totalPoints;
      }
    });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Профи': return 'bg-purple-100 text-purple-800';
      case 'Мастер': return 'bg-blue-100 text-blue-800';
      case 'Любитель': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="pb-16">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3">
        <h1 className="text-xl font-bold">Пользователи</h1>
        <p className="text-purple-100 text-sm">Рейтинг роллеров</p>
      </div>

      <div className="p-3">
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            Все
          </Button>
          <Button
            variant={filterType === 'top' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('top')}
          >
            Топ
          </Button>
          <Button
            variant={filterType === 'new' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('new')}
          >
            Новые
          </Button>
        </div>

        <div className="space-y-2">
          {filteredUsers.map((user, index) => (
            <Card key={user.id} className="p-3">
              <Link to={`/user/${user.id}`} className="block">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold w-8">
                      {getRankIcon(index)}
                    </span>
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-12 h-12 rounded-full"
                      />
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">@{user.username}</h3>
                      <Badge className={getLevelColor(user.level)} variant="secondary">
                        {user.level}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                      <div className="flex items-center">
                        <Star className="w-3 h-3 mr-1 text-yellow-500" />
                        {user.totalPoints}
                      </div>
                      <div className="flex items-center">
                        <Trophy className="w-3 h-3 mr-1 text-orange-500" />
                        {user.wins}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1 text-blue-500" />
                        {user.totalVideos}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Пользователи не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
