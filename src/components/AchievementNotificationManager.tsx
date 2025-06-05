
import React from 'react';
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';
import AchievementNotification from './AchievementNotification';

const AchievementNotificationManager: React.FC = () => {
  const { notifications, removeNotification } = useAchievementNotifications();

  return (
    <>
      {notifications.map((notification, index) => (
        <AchievementNotification
          key={notification.id}
          achievement={notification.achievement}
          onDismiss={() => removeNotification(notification.id)}
        />
      ))}
    </>
  );
};

export default AchievementNotificationManager;
