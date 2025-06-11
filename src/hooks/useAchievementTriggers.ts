
import { useAuth } from '@/components/AuthWrapper';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramNotifications } from './useTelegramNotifications';

export const useAchievementTriggers = () => {
  const { user } = useAuth();
  const { sendAchievementNotification } = useTelegramNotifications();

  const triggerLikeReceived = async (totalLikes: number) => {
    if (!user?.id) return;

    console.log('🔔 Проверяем достижения за лайки:', totalLikes);

    try {
      await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_category: 'likes_received',
        p_new_value: totalLikes
      });
    } catch (error) {
      console.error('Ошибка обновления прогресса достижений (лайки):', error);
    }
  };

  const triggerViewsReceived = async (totalViews: number) => {
    if (!user?.id) return;

    console.log('🔔 Проверяем достижения за просмотры:', totalViews);

    try {
      await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_category: 'views_received',
        p_new_value: totalViews
      });
    } catch (error) {
      console.error('Ошибка обновления прогресса достижений (просмотры):', error);
    }
  };

  const triggerRatingReceived = async (totalRatings: number, averageRating: number) => {
    if (!user?.id) return;

    console.log('🔔 Проверяем достижения за рейтинг:', { totalRatings, averageRating });

    try {
      await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_category: 'ratings_received',
        p_new_value: totalRatings
      });

      if (averageRating >= 4.0) {
        await supabase.rpc('update_achievement_progress', {
          p_user_id: user.id,
          p_category: 'high_rating',
          p_new_value: Math.floor(averageRating * 10)
        });
      }
    } catch (error) {
      console.error('Ошибка обновления прогресса достижений (рейтинг):', error);
    }
  };

  const triggerVideoUploaded = async () => {
    if (!user?.id) return;

    console.log('🔔 Проверяем достижения за загрузку видео');

    try {
      await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_category: 'videos_uploaded',
        p_increment: 1
      });
    } catch (error) {
      console.error('Ошибка обновления прогресса достижений (загрузка видео):', error);
    }
  };

  const triggerDailyWin = async () => {
    if (!user?.id) return;

    console.log('🔔 Проверяем достижения за ежедневную победу');

    try {
      await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_category: 'daily_wins',
        p_increment: 1
      });
    } catch (error) {
      console.error('Ошибка обновления прогресса достижений (ежедневные победы):', error);
    }
  };

  const notifyAchievement = async (achievementTitle: string, achievementIcon: string, rewardPoints: number) => {
    if (!user?.id || !user.telegram_id) return;

    console.log('📱 Отправляем уведомление о достижении:', achievementTitle);

    try {
      await sendAchievementNotification(
        user.id,
        user.telegram_id,
        achievementTitle,
        achievementIcon,
        rewardPoints
      );
    } catch (error) {
      console.error('Ошибка отправки уведомления о достижении:', error);
    }
  };

  return {
    triggerLikeReceived,
    triggerViewsReceived,
    triggerRatingReceived,
    triggerVideoUploaded,
    triggerDailyWin,
    notifyAchievement,
  };
};
