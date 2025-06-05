
import React from 'react';
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';
import AchievementNotification from './AchievementNotification';

const AchievementNotificationManager: React.FC = () => {
  const { notifications, removeNotification } = useAchievementNotifications();

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div 
          key={notification.id}
          style={{ 
            transform: `translateY(${index * 90}px)`,
            zIndex: 1000 + index 
          }}
        >
          <AchievementNotification
            achievement={notification.achievement}
            onDismiss={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default AchievementNotificationManager;
