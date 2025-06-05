
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward_points: number;
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({ achievement, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300); // Ждем завершения анимации
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-80"
        >
          <Card className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white border-0 shadow-2xl">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <h3 className="font-bold text-lg mb-1">🏆 Достижение получено!</h3>
                <h4 className="font-semibold text-base mb-1">{achievement.title}</h4>
                <p className="text-sm opacity-90 mb-2">{achievement.description}</p>
                <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-bold">
                  +{achievement.reward_points} баллов!
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementNotification;
