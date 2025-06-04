
import { useEffect } from 'react';
import { useUserVideos } from './useUserVideos';
import { useAuth } from '@/components/AuthWrapper';
import { useAchievementTriggers } from './useAchievementTriggers';

export const useUserStatsTracker = () => {
  const { user } = useAuth();
  const { data: userVideos } = useUserVideos();
  const { 
    triggerLikeReceived, 
    triggerViewsReceived, 
    triggerRatingReceived,
    triggerLikeStreak 
  } = useAchievementTriggers();

  useEffect(() => {
    if (!user || !userVideos) return;

    console.log('Обновляем статистику пользователя:', userVideos);

    // Подсчитываем общую статистику
    let totalLikes = 0;
    let totalViews = 0;
    let totalRatings = 0;
    let totalRatingSum = 0;
    let consecutiveLikedVideos = 0;
    let currentStreak = 0;

    userVideos.forEach((video, index) => {
      totalLikes += video.likes_count || 0;
      totalViews += video.views || 0;
      
      if (video.average_rating && video.average_rating > 0) {
        totalRatings++;
        totalRatingSum += video.average_rating;
      }

      // Подсчитываем серию лайков (видео с лайками подряд)
      if (video.likes_count && video.likes_count > 0) {
        currentStreak++;
        consecutiveLikedVideos = Math.max(consecutiveLikedVideos, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    const averageRating = totalRatings > 0 ? totalRatingSum / totalRatings : 0;

    // Обновляем достижения
    if (totalLikes > 0) {
      triggerLikeReceived(totalLikes);
    }

    if (totalViews > 0) {
      triggerViewsReceived(totalViews);
    }

    if (totalRatings > 0) {
      triggerRatingReceived(totalRatings, averageRating);
    }

    if (consecutiveLikedVideos > 0) {
      triggerLikeStreak(consecutiveLikedVideos);
    }

    console.log('Статистика пользователя:', {
      totalLikes,
      totalViews,
      totalRatings,
      averageRating,
      consecutiveLikedVideos
    });

  }, [user, userVideos, triggerLikeReceived, triggerViewsReceived, triggerRatingReceived, triggerLikeStreak]);
};
