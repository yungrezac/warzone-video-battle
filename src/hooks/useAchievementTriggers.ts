import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useTelegramNotifications } from './useTelegramNotifications';

export const useAchievementTriggers = () => {
  const { user } = useAuth();
  const { sendAchievementNotification } = useTelegramNotifications();

  const triggerVideoUpload = async () => {
    if (!user?.id) return;

    console.log('Триггерим достижение за первую загрузку видео');

    try {
      const { error } = await supabase.rpc('check_and_grant_achievement', {
        p_user_id: user.id,
        p_achievement_category: 'first_video',
      });

      if (error) {
        console.error('Ошибка при триггере достижения за первую загрузку видео:', error);
        throw error;
      }

      console.log('Достижение за первую загрузку видео успешно проверено и выдано');
    } catch (error) {
      console.error('Ошибка в triggerVideoUpload:', error);
      throw error;
    }
  };

  const triggerLikeReceived = async (totalLikes: number) => {
    if (!user?.id) return;

    console.log('Триггерим достижения за лайки:', totalLikes);

    try {
      const { error } = await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_category: 'likes_received',
        p_new_value: totalLikes
      });

      if (error) {
        console.error('Ошибка обновления достижений за лайки:', error);
        throw error;
      }

      console.log('Достижения за лайки успешно обновлены');
    } catch (error) {
      console.error('Ошибка в triggerLikeReceived:', error);
      throw error;
    }
  };

  const triggerViewsReceived = async (totalViews: number) => {
    if (!user?.id) return;

    console.log('Триггерим достижения за просмотры:', totalViews);

    try {
      const { error } = await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_category: 'views_received',
        p_new_value: totalViews
      });

      if (error) {
        console.error('Ошибка обновления достижений за просмотры:', error);
        throw error;
      }

      console.log('Достижения за просмотры успешно обновлены');
    } catch (error) {
      console.error('Ошибка в triggerViewsReceived:', error);
      throw error;
    }
  };

  const triggerRatingReceived = async (totalRatings: number, averageRating: number) => {
    if (!user?.id) return;

    console.log('Триггерим достижения за рейтинги:', totalRatings, averageRating);

    try {
      const { error } = await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_category: 'rating_received',
        p_new_value: totalRatings
      });

      if (error) {
        console.error('Ошибка обновления достижений за рейтинги:', error);
        throw error;
      }

      console.log('Достижения за рейтинги успешно обновлены');
    } catch (error) {
      console.error('Ошибка в triggerRatingReceived:', error);
      throw error;
    }
  };

  const triggerLikeStreak = async (streakLength: number) => {
     if (!user?.id) return;

    console.log('Триггерим достижения за серию лайков:', streakLength);

    try {
      const { error } = await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_category: 'like_streak',
        p_new_value: streakLength
      });

      if (error) {
        console.error('Ошибка обновления достижений за серию лайков:', error);
        throw error;
      }

      console.log('Достижения за серию лайков успешно обновлены');
    } catch (error) {
      console.error('Ошибка в triggerLikeStreak:', error);
      throw error;
    }
  };

  const triggerSocialLike = async () => {
    if (!user?.id) return;

    console.log('Триггерим достижение за лайк в соц. сетях');

    try {
      const { error } = await supabase.rpc('check_and_grant_achievement', {
        p_user_id: user.id,
        p_achievement_category: 'social_like',
      });

      if (error) {
        console.error('Ошибка при триггере достижения за лайк в соц. сетях:', error);
        throw error;
      }

      console.log('Достижение за лайк в соц. сетях успешно проверено и выдано');
    } catch (error) {
      console.error('Ошибка в triggerSocialLike:', error);
      throw error;
    }
  };

  const triggerSocialRating = async () => {
    if (!user?.id) return;

    console.log('Триггерим достижение за оценку в соц. сетях');

    try {
      const { error } = await supabase.rpc('check_and_grant_achievement', {
        p_user_id: user.id,
        p_achievement_category: 'social_rating',
      });

      if (error) {
        console.error('Ошибка при триггере достижения за оценку в соц. сетях:', error);
        throw error;
      }

      console.log('Достижение за оценку в соц. сетях успешно проверено и выдано');
    } catch (error) {
      console.error('Ошибка в triggerSocialRating:', error);
      throw error;
    }
  };

   const triggerComment = async () => {
    if (!user?.id) return;

    console.log('Триггерим достижение за первый комментарий');

    try {
      const { error } = await supabase.rpc('check_and_grant_achievement', {
        p_user_id: user.id,
        p_achievement_category: 'first_comment',
      });

      if (error) {
        console.error('Ошибка при триггере достижения за первый комментарий:', error);
        throw error;
      }

      console.log('Достижение за первый комментарий успешно проверено и выдано');
    } catch (error) {
      console.error('Ошибка в triggerComment:', error);
      throw error;
    }
  };

  const triggerTimeBasedAchievement = async (category: string) => {
    if (!user?.id) return;

    console.log(`Триггерим достижение, основанное на времени: ${category}`);

    try {
      const { error } = await supabase.rpc('check_and_grant_achievement', {
        p_user_id: user.id,
        p_achievement_category: category,
      });

      if (error) {
        console.error(`Ошибка при триггере достижения, основанного на времени (${category}):`, error);
        throw error;
      }

      console.log(`Достижение, основанное на времени (${category}), успешно проверено и выдано`);
    } catch (error) {
      console.error(`Ошибка в triggerTimeBasedAchievement (${category}):`, error);
      throw error;
    }
  };

  const triggerWin = async (totalWins: number) => {
    if (!user?.id) return;

    console.log('Триггерим достижения за победы:', totalWins);

    try {
      // Обновляем прогресс достижений за победы
      const { error } = await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_category: 'wins',
        p_new_value: totalWins
      });

      if (error) {
        console.error('Ошибка обновления достижений за победы:', error);
        throw error;
      }

      console.log('Достижения за победы успешно обновлены');
    } catch (error) {
      console.error('Ошибка в triggerWin:', error);
      throw error;
    }
  };

  return {
    triggerVideoUpload,
    triggerLikeReceived,
    triggerViewsReceived,
    triggerRatingReceived,
    triggerLikeStreak,
    triggerSocialLike,
    triggerSocialRating,
    triggerComment,
    triggerTimeBasedAchievement,
    triggerWin, // Добавляем новую функцию
  };
};
