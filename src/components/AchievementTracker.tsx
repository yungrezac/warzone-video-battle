
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthWrapper';
import { supabase } from '@/integrations/supabase/client';
import AchievementNotification from './AchievementNotification';
import { Achievement } from '@/hooks/useAchievements';

const AchievementTracker: React.FC = () => {
  const { user } = useAuth();
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    console.log('🎯 Настраиваем отслеживание новых достижений для пользователя:', user.id);

    // Подписываемся на изменения в таблице user_achievements
    const channel = supabase
      .channel('achievement-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('🏆 Получено обновление достижения:', payload);
          
          // Проверяем, было ли достижение только что завершено
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          if (newRecord.is_completed && !oldRecord.is_completed) {
            console.log('🎉 Новое достижение завершено!', newRecord.achievement_id);
            
            // Загружаем данные о достижении
            try {
              const { data: achievement, error } = await supabase
                .from('achievements')
                .select('*')
                .eq('id', newRecord.achievement_id)
                .single();
              
              if (achievement && !error) {
                console.log('🏅 Показываем уведомление о достижении:', achievement.title);
                setNewAchievement(achievement);
                setShowNotification(true);
              }
            } catch (error) {
              console.error('❌ Ошибка загрузки данных достижения:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Отключаемся от отслеживания достижений');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleCloseNotification = () => {
    console.log('❌ Закрываем уведомление о достижении');
    setShowNotification(false);
    setNewAchievement(null);
  };

  if (!newAchievement) return null;

  return (
    <AchievementNotification
      achievement={newAchievement}
      onClose={handleCloseNotification}
      isVisible={showNotification}
    />
  );
};

export default AchievementTracker;
