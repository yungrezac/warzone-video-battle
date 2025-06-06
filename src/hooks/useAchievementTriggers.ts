
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
  const triggerVideoUpload = () => {
    if (!user) return;
    
    // Достижения за количество видео
    updateProgress.mutate({ category: 'videos' });
    
    // Проверяем время загрузки для временных достижений
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 8) {
      updateProgress.mutate({ category: 'time' }); // Раннее утро
    } else if (hour >= 22) {
      updateProgress.mutate({ category: 'time' }); // Ночной роллер
    }
  };

  // Функция для обновления достижений при получении лайка
  const triggerLikeReceived = (totalLikes: number) => {
    if (!user) return;
    updateProgress.mutate({ category: 'likes', newValue: totalLikes });
  };

  // Функция для обновления достижений при получении просмотров
  const triggerViewsReceived = (totalViews: number) => {
    if (!user) return;
    updateProgress.mutate({ category: 'views', newValue: totalViews });
  };

  // Функция для обновления достижений при получении рейтинга
  const triggerRatingReceived = (totalRatings: number, averageRating?: number) => {
    if (!user) return;
    updateProgress.mutate({ category: 'ratings', newValue: totalRatings });
    
    // Для достижения "Мастерство" проверяем средний рейтинг
    if (averageRating && averageRating >= 4.5) {
      updateProgress.mutate({ category: 'rating_avg', newValue: Math.round(averageRating * 10) });
    }
  };

  // Функция для обновления достижений при победе
  const triggerWin = () => {
    if (!user) return;
    updateProgress.mutate({ category: 'wins' });
  };

  // Функция для обновления достижений при лайке другому пользователю
  const triggerSocialLike = () => {
    if (!user) return;
    updateProgress.mutate({ category: 'social_likes' });
  };

  // Функция для обновления достижений при оценке другого видео
  const triggerSocialRating = () => {
    if (!user) return;
    updateProgress.mutate({ category: 'social_ratings' });
  };

  // Функция для обновления достижений при комментарии
  const triggerComment = () => {
    if (!user) return;
    updateProgress.mutate({ category: 'comments' });
  };

  // Функция для отправки уведомления о новом достижении
  const notifyAchievement = async (achievementTitle: string, achievementIcon: string, rewardPoints: number) => {
    if (!user?.telegram_id) return;
    
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
    notifyAchievement,
  };
};
