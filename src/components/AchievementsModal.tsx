
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserAchievements, useAchievementStats } from '@/hooks/useAchievements';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock } from 'lucide-react';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose }) => {
  const { data: userAchievements } = useUserAchievements();
  const { data: achievementStats } = useAchievementStats();

  const completedAchievements = userAchievements?.filter(ua => ua.is_completed) || [];
  const inProgressAchievements = userAchievements?.filter(ua => !ua.is_completed) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Достижения
          </DialogTitle>
        </DialogHeader>

        {achievementStats && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-600">{achievementStats.completed}</div>
              <div className="text-xs text-green-700">Получено</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-600">{achievementStats.remaining}</div>
              <div className="text-xs text-blue-700">Осталось</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-orange-600">{achievementStats.completionRate}%</div>
              <div className="text-xs text-orange-700">Прогресс</div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {completedAchievements.length > 0 && (
            <div>
              <h3 className="font-semibold text-green-600 mb-2">Полученные достижения</h3>
              <div className="space-y-2">
                {completedAchievements.map(ua => (
                  <div key={ua.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{ua.achievement.icon}</span>
                      <div>
                        <div className="font-medium text-sm">{ua.achievement.title}</div>
                        <div className="text-xs text-gray-600">{ua.achievement.description}</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      +{ua.achievement.reward_points}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inProgressAchievements.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-600 mb-2">В процессе</h3>
              <div className="space-y-2">
                {inProgressAchievements.map(ua => (
                  <div key={ua.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-xl mr-2 opacity-50">{ua.achievement.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{ua.achievement.title}</div>
                        <div className="text-xs text-gray-600 mb-1">{ua.achievement.description}</div>
                        <Progress 
                          value={(ua.current_progress / ua.achievement.target_value) * 100} 
                          className="h-1"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {ua.current_progress} / {ua.achievement.target_value}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      +{ua.achievement.reward_points}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AchievementsModal;
