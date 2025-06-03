
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  target_value: number;
  reward_points: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  current_progress: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  achievement: Achievement;
}

export const useAchievements = () => {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('target_value', { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
  });
};

export const useUserAchievements = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id)
        .order('is_completed', { ascending: true })
        .order('current_progress', { ascending: false });

      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!user?.id,
  });
};

export const useUpdateAchievementProgress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      category, 
      newValue, 
      increment = 1 
    }: { 
      category: string; 
      newValue?: number; 
      increment?: number; 
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Обновляем прогресс достижений для пользователя:', user.id, 'категория:', category, 'новое значение:', newValue, 'инкремент:', increment);

      // Получаем все активные достижения для данной категории
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('id, target_value, reward_points')
        .eq('category', category)
        .eq('is_active', true);

      if (achievementsError) throw achievementsError;

      if (!achievements || achievements.length === 0) {
        console.log('Нет активных достижений для категории:', category);
        return;
      }

      // Получаем текущий прогресс пользователя для этих достижений
      const achievementIds = achievements.map(a => a.id);
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .in('achievement_id', achievementIds)
        .eq('is_completed', false);

      if (userAchievementsError) throw userAchievementsError;

      // Обновляем прогресс для каждого незавершенного достижения
      for (const achievement of achievements) {
        const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);
        
        if (!userAchievement) {
          console.log('Пользователь не имеет записи для достижения:', achievement.id);
          continue;
        }

        if (userAchievement.is_completed) {
          continue; // Пропускаем уже завершенные достижения
        }

        let newProgress: number;
        if (newValue !== undefined) {
          newProgress = newValue;
        } else {
          newProgress = userAchievement.current_progress + increment;
        }

        const isNowCompleted = newProgress >= achievement.target_value;
        if (isNowCompleted) {
          newProgress = achievement.target_value;
        }

        console.log('Обновляем достижение:', achievement.id, 'прогресс:', userAchievement.current_progress, '->', newProgress, 'завершено:', isNowCompleted);

        // Обновляем прогресс достижения
        const { error: updateError } = await supabase
          .from('user_achievements')
          .update({
            current_progress: newProgress,
            is_completed: isNowCompleted,
            completed_at: isNowCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userAchievement.id);

        if (updateError) {
          console.error('Ошибка обновления достижения:', updateError);
          throw updateError;
        }

        // Если достижение только что завершено, добавляем баллы
        if (isNowCompleted && !userAchievement.is_completed) {
          console.log('Достижение завершено! Добавляем баллы:', achievement.reward_points);
          
          const { error: pointsError } = await supabase
            .from('user_points')
            .update({
              total_points: supabase.sql`COALESCE(total_points, 0) + ${achievement.reward_points}`,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          if (pointsError) {
            console.error('Ошибка обновления баллов:', pointsError);
            // Не бросаем ошибку, так как это не критично
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

export const useAchievementStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['achievement-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_achievements')
        .select('is_completed')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data.length;
      const completed = data.filter(item => item.is_completed).length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total,
        completed,
        remaining: total - completed,
        completionRate,
      };
    },
    enabled: !!user?.id,
  });
};
