
import { useEffect, useState } from 'react';
import { useUserAchievements, Achievement } from './useAchievements';
import { useAuth } from '@/components/AuthWrapper';

export interface AchievementNotificationData {
  achievement: Achievement;
  id: string;
}

export const useAchievementNotifications = () => {
  const { user } = useAuth();
  const { data: userAchievements } = useUserAchievements();
  const [notifications, setNotifications] = useState<AchievementNotificationData[]>([]);
  const [lastCompletedIds, setLastCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userAchievements || !user) return;

    // Находим новые завершенные достижения
    const currentCompletedIds = new Set(
      userAchievements
        .filter(ua => ua.is_completed)
        .map(ua => ua.achievement_id)
    );

    // Проверяем, какие достижения были только что завершены
    const newlyCompleted = userAchievements.filter(ua => 
      ua.is_completed && 
      !lastCompletedIds.has(ua.achievement_id)
    );

    if (newlyCompleted.length > 0) {
      console.log('Новые завершенные достижения:', newlyCompleted);
      
      // Добавляем уведомления для новых достижений
      const newNotifications = newlyCompleted.map(ua => ({
        achievement: ua.achievement,
        id: `${ua.achievement_id}-${Date.now()}`,
      }));

      setNotifications(prev => [...prev, ...newNotifications]);
    }

    setLastCompletedIds(currentCompletedIds);
  }, [userAchievements, user, lastCompletedIds]);

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return {
    notifications,
    removeNotification,
  };
};
