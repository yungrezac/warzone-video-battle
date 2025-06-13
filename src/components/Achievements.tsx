
import React, { useState } from 'react';
import { Trophy, Target, Award, Star } from 'lucide-react';
import { useUserAchievements, useAchievementStats } from '@/hooks/useAchievements';
import { useAuth } from '@/components/AuthWrapper';
import AchievementCard from './AchievementCard';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Achievements: React.FC = () => {
  const { user } = useAuth();
  const { data: userAchievements, isLoading: achievementsLoading } = useUserAchievements();
  const { data: stats, isLoading: statsLoading } = useAchievementStats();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (achievementsLoading || statsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] pb-16">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-3 pb-16">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm">
          Войдите в систему, чтобы видеть достижения
        </div>
      </div>
    );
  }

  if (!userAchievements || userAchievements.length === 0) {
    return (
      <div className="p-3 pb-16">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-3 py-2 rounded text-sm">
          Загружаем достижения...
        </div>
      </div>
    );
  }

  const categories = [
    { key: 'videos', name: 'Видео', icon: '🎬', color: 'bg-blue-500' },
    { key: 'likes', name: 'Лайки', icon: '❤️', color: 'bg-red-500' },
    { key: 'views', name: 'Просмотры', icon: '👁️', color: 'bg-green-500' },
    { key: 'ratings', name: 'Рейтинги', icon: '⭐', color: 'bg-yellow-500' },
    { key: 'wins', name: 'Победы', icon: '🏆', color: 'bg-purple-500' },
    { key: 'social_likes', name: 'Активность', icon: '👍', color: 'bg-pink-500' },
    { key: 'comments', name: 'Комментарии', icon: '💬', color: 'bg-cyan-500' },
    { key: 'time', name: 'Время', icon: '🕐', color: 'bg-indigo-500' },
  ];

  const filteredAchievements = selectedCategory
    ? userAchievements?.filter(ua => ua.achievement.category === selectedCategory)
    : userAchievements;

  const completedAchievements = filteredAchievements?.filter(ua => ua.is_completed) || [];
  const inProgressAchievements = filteredAchievements?.filter(ua => !ua.is_completed) || [];

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-3">
        <div className="flex items-center mb-2">
          <Trophy className="w-6 h-6 mr-2" />
          <h1 className="text-lg font-bold">Достижения</h1>
        </div>
        <p className="text-sm opacity-90">
          Выполняйте задания и получайте награды за свои успехи!
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="p-3">
          <div className="bg-white rounded-lg shadow-md p-3 mb-3">
            <h3 className="text-base font-semibold mb-2 flex items-center">
              <Target className="w-4 h-4 mr-2 text-orange-500" />
              Общий прогресс
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Выполнено достижений</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {stats.completed}/{stats.total}
                  </span>
                </div>
                <Progress value={stats.completionRate} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {stats.completionRate}% завершено
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-green-600">{stats.completed}</div>
                  <div className="text-xs text-green-700">Выполнено</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-blue-600">{stats.remaining}</div>
                  <div className="text-xs text-blue-700">Осталось</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-orange-600">{stats.total}</div>
                  <div className="text-xs text-orange-700">Всего</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="p-3">
        <div className="bg-white rounded-lg shadow-md p-3 mb-3">
          <h3 className="text-base font-semibold mb-2 flex items-center">
            <Award className="w-4 h-4 mr-2 text-blue-500" />
            Категории
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="text-xs"
            >
              Все
            </Button>
            {categories.map(category => {
              const categoryAchievements = userAchievements?.filter(
                ua => ua.achievement.category === category.key
              ) || [];
              const completedCount = categoryAchievements.filter(ua => ua.is_completed).length;
              
              return (
                <Button
                  key={category.key}
                  variant={selectedCategory === category.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.key)}
                  className="text-xs relative"
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                  {completedCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                      {completedCount}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Achievements List */}
      <div className="p-3">
        {completedAchievements.length > 0 && (
          <div className="mb-4">
            <h3 className="text-base font-semibold mb-2 flex items-center text-green-600">
              <Star className="w-4 h-4 mr-2" />
              Выполненные ({completedAchievements.length})
            </h3>
            <div className="space-y-2">
              {completedAchievements.map(userAchievement => (
                <AchievementCard 
                  key={userAchievement.id} 
                  userAchievement={userAchievement} 
                />
              ))}
            </div>
          </div>
        )}

        {inProgressAchievements.length > 0 && (
          <div>
            <h3 className="text-base font-semibold mb-2 flex items-center text-blue-600">
              <Target className="w-4 h-4 mr-2" />
              В процессе ({inProgressAchievements.length})
            </h3>
            <div className="space-y-2">
              {inProgressAchievements.map(userAchievement => (
                <AchievementCard 
                  key={userAchievement.id} 
                  userAchievement={userAchievement} 
                />
              ))}
            </div>
          </div>
        )}

        {filteredAchievements?.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Достижения в этой категории отсутствуют</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
