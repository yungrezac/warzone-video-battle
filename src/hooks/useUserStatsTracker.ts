
import { useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { useUpdateAchievementProgress } from './useAchievements';
import { useAuth } from '@/components/AuthWrapper';

export const useUserStatsTracker = () => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const updateProgress = useUpdateAchievementProgress();

  useEffect(() => {
    if (!user || !userProfile) return;

    console.log('Обновляем прогресс достижений на основе статистики пользователя:', {
      videos: userProfile.total_videos,
      likes: userProfile.total_likes,
      views: userProfile.total_views,
      wins: userProfile.wins_count
    });

    // Обновляем достижения на основе текущей статистики
    const updateAchievements = async () => {
      try {
        // Достижения за видео
        if (userProfile.total_videos > 0) {
          await updateProgress.mutateAsync({
            category: 'videos',
            newValue: userProfile.total_videos
          });
        }

        // Достижения за лайки
        if (userProfile.total_likes > 0) {
          await updateProgress.mutateAsync({
            category: 'likes',
            newValue: userProfile.total_likes
          });
        }

        // Достижения за просмотры
        if (userProfile.total_views > 0) {
          await updateProgress.mutateAsync({
            category: 'views',
            newValue: userProfile.total_views
          });
        }

        // Достижения за победы
        if (userProfile.wins_count > 0) {
          await updateProgress.mutateAsync({
            category: 'wins',
            newValue: userProfile.wins_count
          });
        }
      } catch (error) {
        console.error('Ошибка при обновлении прогресса достижений:', error);
      }
    };

    updateAchievements();
  }, [user, userProfile, updateProgress]);
};
