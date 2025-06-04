
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
          onClose={() => removeNotification(notification.id)}
          isVisible={true}
          style={{ top: `${20 + index * 80}px` }}
        />
      ))}
    </>
  );
};

export default AchievementNotificationManager;
