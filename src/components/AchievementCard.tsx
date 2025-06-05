
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { UserAchievement } from '@/hooks/useAchievements';

interface AchievementCardProps {
  userAchievement: UserAchievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ userAchievement }) => {
  const { achievement, current_progress, is_completed, completed_at } = userAchievement;
  const progressPercentage = Math.min((current_progress / achievement.target_value) * 100, 100);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'videos': return 'bg-blue-500';
      case 'likes': return 'bg-red-500';
      case 'views': return 'bg-green-500';
      case 'ratings': return 'bg-yellow-500';
      case 'wins': return 'bg-purple-500';
      case 'social_likes': return 'bg-pink-500';
      case 'social_ratings': return 'bg-orange-500';
      case 'comments': return 'bg-cyan-500';
      case 'time': return 'bg-indigo-500';
      case 'daily': return 'bg-teal-500';
      case 'streak': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'videos': return 'Видео';
      case 'likes': return 'Лайки';
      case 'views': return 'Просмотры';
      case 'ratings': return 'Рейтинги';
      case 'wins': return 'Победы';
      case 'social_likes': return 'Социальные';
      case 'social_ratings': return 'Оценки';
      case 'comments': return 'Комментарии';
      case 'time': return 'Время';
      case 'daily': return 'Ежедневно';
      case 'streak': return 'Серии';
      default: return 'Общие';
    }
  };

  return (
    <div className={`bg-white rounded-lg p-3 border-2 transition-all ${
      is_completed 
        ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          <span className="text-2xl mr-2">{achievement.icon}</span>
          <div className="flex-1">
            <h3 className={`font-semibold text-sm ${is_completed ? 'text-yellow-700' : 'text-gray-900'}`}>
              {achievement.title}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {achievement.description}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <Badge 
            variant="secondary" 
            className={`text-xs px-1.5 py-0.5 ${getCategoryColor(achievement.category)} text-white`}
          >
            {getCategoryName(achievement.category)}
          </Badge>
          {is_completed && (
            <Badge variant="outline" className="text-xs mt-1 border-yellow-400 text-yellow-700">
              ✓ Выполнено
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">
            Прогресс: {current_progress}/{achievement.target_value}
          </span>
          <span className={`font-semibold ${is_completed ? 'text-yellow-700' : 'text-blue-600'}`}>
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
        
        <Progress 
          value={progressPercentage} 
          className={`h-2 ${is_completed ? 'bg-yellow-100' : 'bg-gray-200'}`}
        />

        <div className="flex justify-between items-center">
          <span className="text-xs text-green-600 font-medium">
            +{achievement.reward_points} баллов
          </span>
          {completed_at && (
            <span className="text-xs text-gray-500">
              {new Date(completed_at).toLocaleDateString('ru-RU')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementCard;
