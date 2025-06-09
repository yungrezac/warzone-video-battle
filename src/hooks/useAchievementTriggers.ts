
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
    console.log('🎬 Триггер: загрузка видео');
    // Примечание: логика обновления достижений теперь в useUploadVideo
    // Это нужно для избежания дублирования
  };

  // Функция для обновления достижений при получении лайка
  const triggerLikeReceived = (totalLikes: number) => {
    if (!user) {
      console.log('❌ Пользователь не авторизован для обновления достижений за лайки');
      return;
    }
    console.log('❤️ Триггер: получен лайк, всего лайков:', totalLikes);
    updateProgress.mutate({ category: 'likes', newValue: totalLikes });
  };

  // Функция для обновления достижений при получении просмотров
  const triggerViewsReceived = (totalViews: number) => {
    if (!user) {
      console.log('❌ Пользователь не авторизован для обновления достижений за просмотры');
      return;
    }
    console.log('👁️ Триггер: получен просмотр, всего просмотров:', totalViews);
    updateProgress.mutate({ category: 'views', newValue: totalViews });
  };

  // Функция для обновления достижений при получении рейтинга
  const triggerRatingReceived = (totalRatings: number, averageRating?: number) => {
    if (!user) {
      console.log('❌ Пользователь не авторизован для обновления достижений за рейтинги');
      return;
    }
    console.log('⭐ Триггер: получен рейтинг, всего рейтингов:', totalRatings, 'средний:', averageRating);
    updateProgress.mutate({ category: 'ratings', newValue: totalRatings });
    
    // Для достижения "Мастерство" проверяем средний рейтинг
    if (averageRating && averageRating >= 4.5) {
      updateProgress.mutate({ category: 'rating_avg', newValue: Math.round(averageRating * 10) });
    }
  };

  // Функция для обновления достижений при победе
  const triggerWin = () => {
    if (!user) {
      console.log('❌ Пользователь не авторизован для обновления достижений за победы');
      return;
    }
    console.log('🏆 Триггер: победа');
    updateProgress.mutate({ category: 'wins' });
  };

  // Функция для обновления достижений при лайке другому пользователю
  const triggerSocialLike = () => {
    if (!user) {
      console.log('❌ Пользователь не авторизован для обновления достижений за социальные лайки');
      return;
    }
    console.log('👍 Триггер: лайк другому пользователю');
    updateProgress.mutate({ category: 'social_likes' });
  };

  // Функция для обновления достижений при оценке другого видео
  const triggerSocialRating = () => {
    if (!user) {
      console.log('❌ Пользователь не авторизован для обновления достижений за социальные оценки');
      return;
    }
    console.log('📊 Триггер: оценка другого видео');
    updateProgress.mutate({ category: 'social_ratings' });
  };

  // Функция для обновления достижений при комментарии
  const triggerComment = () => {
    if (!user) {
      console.log('❌ Пользователь не авторизован для обновления достижений за комментарии');
      return;
    }
    console.log('💬 Триггер: комментарий');
    updateProgress.mutate({ category: 'comments' });
  };

  // Функция для отправки уведомления о новом достижении
  const notifyAchievement = async (achievementTitle: string, achievementIcon: string, rewardPoints: number) => {
    if (!user?.telegram_id) {
      console.log('❌ Нет telegram_id для отправки уведомления о достижении');
      return;
    }
    
    try {
      console.log('📱 Отправляем уведомление о достижении:', achievementTitle);
      await sendAchievementNotification(user.telegram_id, achievementTitle, achievementIcon, rewardPoints);
    } catch (error) {
      console.error('❌ Ошибка отправки уведомления о достижении:', error);
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
