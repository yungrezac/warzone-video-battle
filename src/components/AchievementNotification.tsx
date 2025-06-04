
import React, { useEffect, useState } from 'react';
import { Achievement } from '@/hooks/useAchievements';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useAchievementTriggers } from '@/hooks/useAchievementTriggers';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
  isVisible: boolean;
  style?: React.CSSProperties;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose,
  isVisible,
  style,
}) => {
  const [shouldShow, setShouldShow] = useState(false);
  const { notifyAchievement } = useAchievementTriggers();

  useEffect(() => {
    if (isVisible) {
      setShouldShow(true);
      
      // Отправляем Telegram уведомление о достижении
      notifyAchievement(achievement.title, achievement.icon, achievement.reward_points);
      
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShouldShow(false);
    }
  }, [isVisible, onClose, achievement, notifyAchievement]);

  if (!shouldShow) return null;

  return (
    <div 
      className={`fixed left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      style={style}
    >
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg shadow-lg p-4 max-w-sm mx-4 animate-bounce">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-3xl mr-3 animate-pulse">{achievement.icon}</span>
            <div>
              <h3 className="font-bold text-sm">🎉 Достижение получено!</h3>
              <p className="text-xs opacity-90 font-semibold">{achievement.title}</p>
              <p className="text-xs opacity-75 mt-1">+{achievement.reward_points} баллов 💎</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;
