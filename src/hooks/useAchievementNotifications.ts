
import { useEffect, useState, useRef } from 'react';
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
  const previousCompletedRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!userAchievements || !user) return;

    const currentCompleted = userAchievements.filter(ua => ua.is_completed);
    const currentCompletedIds = new Set(currentCompleted.map(ua => ua.achievement_id));

    // Если это первая загрузка, просто сохраняем текущее состояние
    if (!isInitializedRef.current) {
      previousCompletedRef.current = currentCompletedIds;
      isInitializedRef.current = true;
      return;
    }

    // Находим новые завершенные достижения
    const newlyCompleted = currentCompleted.filter(ua => 
      !previousCompletedRef.current.has(ua.achievement_id)
    );

    if (newlyCompleted.length > 0) {
      console.log('Новые достижения получены:', newlyCompleted.map(ua => ua.achievement.title));
      
      // Создаем уведомления для новых достижений
      const newNotifications = newlyCompleted.map(ua => ({
        achievement: ua.achievement,
        id: `${ua.achievement_id}-${Date.now()}-${Math.random()}`,
      }));

      setNotifications(prev => [...prev, ...newNotifications]);
    }

    // Обновляем предыдущее состояние
    previousCompletedRef.current = currentCompletedIds;
  }, [userAchievements, user]);

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return {
    notifications,
    removeNotification,
  };
};
