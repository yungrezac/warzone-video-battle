
import { useEffect, useRef } from 'react';
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

  const lastStatsRef = useRef<{
    totalLikes: number;
    totalViews: number;
    totalRatings: number;
    consecutiveLikedVideos: number;
  }>({
    totalLikes: 0,
    totalViews: 0,
    totalRatings: 0,
    consecutiveLikedVideos: 0
  });

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

    // Обновляем достижения только если статистика изменилась
    const lastStats = lastStatsRef.current;
    
    if (totalLikes !== lastStats.totalLikes) {
      triggerLikeReceived(totalLikes);
    }

    if (totalViews !== lastStats.totalViews) {
      triggerViewsReceived(totalViews);
    }

    if (totalRatings !== lastStats.totalRatings) {
      triggerRatingReceived(totalRatings, averageRating);
    }

    if (consecutiveLikedVideos !== lastStats.consecutiveLikedVideos) {
      triggerLikeStreak(consecutiveLikedVideos);
    }

    // Сохраняем текущую статистику
    lastStatsRef.current = {
      totalLikes,
      totalViews,
      totalRatings,
      consecutiveLikedVideos
    };

    console.log('Статистика пользователя:', {
      totalLikes,
      totalViews,
      totalRatings,
      averageRating,
      consecutiveLikedVideos
    });

  }, [user, userVideos, triggerLikeReceived, triggerViewsReceived, triggerRatingReceived, triggerLikeStreak]);
};
