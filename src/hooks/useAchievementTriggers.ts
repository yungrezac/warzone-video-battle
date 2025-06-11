
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
    if (!user?.id) {
      console.log('❌ Пользователь не авторизован для обновления достижений за загрузку видео');
      return;
    }
    
    console.log('🎬 Триггер: загрузка видео для пользователя', user.id);
    
    try {
      await updateProgress.mutateAsync({ 
        category: 'videos', 
        increment: 1 
      });
      console.log('✅ Достижения за загрузку видео обновлены');
    } catch (error) {
      console.error('❌ Ошибка обновления достижений за загрузку видео:', error);
    }
  };

  // Функция для обновления достижений при получении лайка
  const triggerLikeReceived = async (totalLikes: number) => {
    if (!user?.id) {
      console.log('❌ Пользователь не авторизован для обновления достижений за лайки');
      return;
    }
    
    console.log('❤️ Триггер: получен лайк, всего лайков:', totalLikes);
    
    try {
      await updateProgress.mutateAsync({ 
        category: 'likes', 
        newValue: totalLikes 
      });
      console.log('✅ Достижения за лайки обновлены');
    } catch (error) {
      console.error('❌ Ошибка обновления достижений за лайки:', error);
    }
  };

  // Функция для обновления достижений при получении просмотров
  const triggerViewsReceived = async (totalViews: number) => {
    if (!user?.id) {
      console.log('❌ Пользователь не авторизован для обновления достижений за просмотры');
      return;
    }
    
    console.log('👁️ Триггер: получен просмотр, всего просмотров:', totalViews);
    
    try {
      await updateProgress.mutateAsync({ 
        category: 'views', 
        newValue: totalViews 
      });
      console.log('✅ Достижения за просмотры обновлены');
    } catch (error) {
      console.error('❌ Ошибка обновления достижений за просмотры:', error);
    }
  };

  // Функция для обновления достижений при получении рейтинга
  const triggerRatingReceived = async (totalRatings: number, averageRating?: number) => {
    if (!user?.id) {
      console.log('❌ Пользователь не авторизован для обновления достижений за рейтинги');
      return;
    }
    
    console.log('⭐ Триггер: получен рейтинг, всего рейтингов:', totalRatings, 'средний:', averageRating);
    
    try {
      // Обновляем общее количество рейтингов
      await updateProgress.mutateAsync({ 
        category: 'ratings', 
        newValue: totalRatings 
      });
      
      // Для достижения "Мастерство" проверяем средний рейтинг
      if (averageRating && averageRating >= 4.5) {
        await updateProgress.mutateAsync({ 
          category: 'rating_avg', 
          newValue: Math.round(averageRating * 10) 
        });
      }
      
      console.log('✅ Достижения за рейтинги обновлены');
    } catch (error) {
      console.error('❌ Ошибка обновления достижений за рейтинги:', error);
    }
  };

  // Функция для обновления достижений при победе
  const triggerWin = async () => {
    if (!user?.id) {
      console.log('❌ Пользователь не авторизован для обновления достижений за победы');
      return;
    }
    
    console.log('🏆 Триггер: победа');
    
    try {
      await updateProgress.mutateAsync({ 
        category: 'wins',
        increment: 1
      });
      console.log('✅ Достижения за победы обновлены');
    } catch (error) {
      console.error('❌ Ошибка обновления достижений за победы:', error);
    }
  };

  // Функция для обновления достижений при лайке другому пользователю
  const triggerSocialLike = async () => {
    if (!user?.id) {
      console.log('❌ Пользователь не авторизован для обновления достижений за социальные лайки');
      return;
    }
    
    console.log('👍 Триггер: лайк другому пользователю');
    
    try {
      await updateProgress.mutateAsync({ 
        category: 'social_likes',
        increment: 1
      });
      console.log('✅ Достижения за социальные лайки обновлены');
    } catch (error) {
      console.error('❌ Ошибка обновления достижений за социальные лайки:', error);
    }
  };

  // Функция для обновления достижений при оценке другого видео
  const triggerSocialRating = async () => {
    if (!user?.id) {
      console.log('❌ Пользователь не авторизован для обновления достижений за социальные оценки');
      return;
    }
    
    console.log('📊 Триггер: оценка другого видео');
    
    try {
      await updateProgress.mutateAsync({ 
        category: 'social_ratings',
        increment: 1
      });
      console.log('✅ Достижения за социальные оценки обновлены');
    } catch (error) {
      console.error('❌ Ошибка обновления достижений за социальные оценки:', error);
    }
  };

  // Функция для обновления достижений при комментарии
  const triggerComment = async () => {
    if (!user?.id) {
      console.log('❌ Пользователь не авторизован для обновления достижений за комментарии');
      return;
    }
    
    console.log('💬 Триггер: комментарий');
    
    try {
      await updateProgress.mutateAsync({ 
        category: 'comments',
        increment: 1
      });
      console.log('✅ Достижения за комментарии обновлены');
    } catch (error) {
      console.error('❌ Ошибка обновления достижений за комментарии:', error);
    }
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
      console.log('✅ Уведомление о достижении отправлено');
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
