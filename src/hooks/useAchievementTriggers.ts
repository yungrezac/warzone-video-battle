
import { useEffect } from 'react';
import { useUpdateAchievementProgress } from './useAchievements';
import { useAuth } from '@/components/AuthWrapper';
import { useTelegramNotifications } from './useTelegramNotifications';

// Хук для автоматического обновления достижений при различных действиях
export const useAchievementTriggers = () => {
  const updateProgress = useUpdateAchievementProgress();
  const { user } = useAuth();
  const { sendAchievementNotification } = useTelegramNotifications();

  // Функция для обновления достижений при загрузке видео
  const triggerVideoUpload = async () => {
    if (!user) return;
    
    console.log('Триггер: загрузка видео');
    try {
      // Достижения за количество видео
      await updateProgress.mutateAsync({ category: 'videos' });
      
      // Проверяем время загрузки для временных достижений
      const now = new Date();
      const hour = now.getHours();
      
      if (hour < 8) {
        console.log('Ранняя загрузка видео (до 8 утра)');
        await updateProgress.mutateAsync({ category: 'time' }); // Ранняя пташка
      } else if (hour >= 22) {
        console.log('Поздняя загрузка видео (после 22:00)');
        await updateProgress.mutateAsync({ category: 'time' }); // Ночной роллер
      }
    } catch (error) {
      console.error('Ошибка обновления достижений при загрузке видео:', error);
    }
  };

  // Функция для обновления достижений при получении лайка
  const triggerLikeReceived = async (totalLikes: number) => {
    if (!user) return;
    console.log('Триггер: получен лайк, всего лайков:', totalLikes);
    try {
      await updateProgress.mutateAsync({ category: 'likes', newValue: totalLikes });
    } catch (error) {
      console.error('Ошибка обновления достижений при получении лайка:', error);
    }
  };

  // Функция для обновления достижений при получении просмотров
  const triggerViewsReceived = async (totalViews: number) => {
    if (!user) return;
    console.log('Триггер: получены просмотры, всего просмотров:', totalViews);
    try {
      await updateProgress.mutateAsync({ category: 'views', newValue: totalViews });
    } catch (error) {
      console.error('Ошибка обновления достижений при получении просмотров:', error);
    }
  };

  // Функция для обновления достижений при получении рейтинга
  const triggerRatingReceived = async (totalRatings: number, averageRating?: number) => {
    if (!user) return;
    console.log('Триггер: получен рейтинг, всего рейтингов:', totalRatings, 'средний рейтинг:', averageRating);
    try {
      await updateProgress.mutateAsync({ category: 'ratings', newValue: totalRatings });
      
      // Для достижения "Мастерство" и "Совершенство" проверяем средний рейтинг
      if (averageRating && totalRatings >= 10) {
        if (averageRating >= 4.5) {
          console.log('Проверяем достижение "Мастерство"');
          await updateProgress.mutateAsync({ category: 'rating_avg', newValue: Math.round(averageRating * 10) });
        }
        if (averageRating >= 4.8 && totalRatings >= 20) {
          console.log('Проверяем достижение "Совершенство"');
          await updateProgress.mutateAsync({ category: 'rating_avg', newValue: Math.round(averageRating * 10) });
        }
      }
    } catch (error) {
      console.error('Ошибка обновления достижений при получении рейтинга:', error);
    }
  };

  // Функция для обновления достижений при победе
  const triggerWin = async () => {
    if (!user) return;
    console.log('Триггер: победа');
    try {
      await updateProgress.mutateAsync({ category: 'wins' });
    } catch (error) {
      console.error('Ошибка обновления достижений при победе:', error);
    }
  };

  // Функция для обновления достижений при лайке другому пользователю
  const triggerSocialLike = async () => {
    if (!user) return;
    console.log('Триггер: лайк другому пользователю');
    try {
      await updateProgress.mutateAsync({ category: 'social_likes' });
    } catch (error) {
      console.error('Ошибка обновления достижений при социальном лайке:', error);
    }
  };

  // Функция для обновления достижений при оценке другого видео
  const triggerSocialRating = async () => {
    if (!user) return;
    console.log('Триггер: оценка другого видео');
    try {
      await updateProgress.mutateAsync({ category: 'social_ratings' });
    } catch (error) {
      console.error('Ошибка обновления достижений при социальном рейтинге:', error);
    }
  };

  // Функция для обновления достижений при комментарии
  const triggerComment = async () => {
    if (!user) return;
    console.log('Триггер: комментарий');
    try {
      await updateProgress.mutateAsync({ category: 'comments' });
    } catch (error) {
      console.error('Ошибка обновления достижений при комментарии:', error);
    }
  };

  // Функция для обновления достижений при ежедневном входе
  const triggerDailyLogin = async (streakDays: number) => {
    if (!user) return;
    console.log('Триггер: ежедневный вход, дней подряд:', streakDays);
    try {
      await updateProgress.mutateAsync({ category: 'daily', newValue: streakDays });
    } catch (error) {
      console.error('Ошибка обновления достижений при ежедневном входе:', error);
    }
  };

  // Функция для обновления достижений при серии лайков
  const triggerLikeStreak = async (streakCount: number) => {
    if (!user) return;
    console.log('Триггер: серия лайков, видео подряд:', streakCount);
    try {
      await updateProgress.mutateAsync({ category: 'streak', newValue: streakCount });
    } catch (error) {
      console.error('Ошибка обновления достижений при серии лайков:', error);
    }
  };

  // Функция для отправки уведомления о новом достижении
  const notifyAchievement = async (achievementTitle: string, achievementIcon: string, rewardPoints: number) => {
    if (!user?.telegram_id) return;
    
    console.log('Отправляем уведомление о достижении:', achievementTitle);
    try {
      await sendAchievementNotification(user.telegram_id, achievementTitle, achievementIcon, rewardPoints);
    } catch (error) {
      console.error('Ошибка отправки уведомления о достижении:', error);
    }
  };

  return {
    triggerVideoUpload,
    triggerLikeReceived,
    triggerViewsReceived,
    triggerRatingReceived,
    triggerWin,
    triggerSocialLike,
    triggerSocialRating,
    triggerComment,
    triggerDailyLogin,
    triggerLikeStreak,
    notifyAchievement,
  };
};
