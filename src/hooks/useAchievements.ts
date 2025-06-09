
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
  const { user } = useAuth();

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

      console.log('Загружаем достижения пользователя:', user.id);

      // Получаем все активные достижения
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true);

      if (achievementsError) {
        console.error('Ошибка загрузки достижений:', achievementsError);
        throw achievementsError;
      }

      // Получаем прогресс пользователя по достижениям
      const { data: userProgress, error: progressError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) {
        console.error('Ошибка загрузки прогресса:', progressError);
        throw progressError;
      }

      console.log('Загруженный прогресс пользователя:', userProgress);

      // Создаем карту прогресса пользователя
      const progressMap = new Map();
      userProgress?.forEach(up => {
        progressMap.set(up.achievement_id, up);
      });

      // Для каждого достижения проверяем, есть ли у пользователя запись о прогрессе
      // Если нет - создаем её автоматически
      const missingProgressAchievements = allAchievements?.filter(achievement => 
        !progressMap.has(achievement.id)
      ) || [];

      // Создаем записи для отсутствующих достижений
      if (missingProgressAchievements.length > 0) {
        console.log('Создаем записи для отсутствующих достижений:', missingProgressAchievements.length);
        
        const newProgressRecords = missingProgressAchievements.map(achievement => ({
          user_id: user.id,
          achievement_id: achievement.id,
          current_progress: 0,
          is_completed: false,
        }));

        const { data: createdProgress, error: createError } = await supabase
          .from('user_achievements')
          .insert(newProgressRecords)
          .select('*');

        if (createError) {
          console.error('Ошибка создания записей прогресса:', createError);
        } else {
          // Добавляем созданные записи к прогрессу
          createdProgress?.forEach(cp => {
            progressMap.set(cp.achievement_id, cp);
          });
        }
      }

      // Объединяем данные - для каждого достижения показываем прогресс
      const result = allAchievements?.map(achievement => {
        const userProgress = progressMap.get(achievement.id);
        
        if (!userProgress) {
          // Если записи всё ещё нет (ошибка создания), создаем виртуальную
          return {
            id: `virtual-${achievement.id}`,
            user_id: user.id,
            achievement_id: achievement.id,
            current_progress: 0,
            is_completed: false,
            completed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            achievement: achievement,
          };
        }

        return {
          ...userProgress,
          achievement: achievement,
        };
      }) || [];

      console.log('Финальный результат достижений:', result);
      return result as UserAchievement[];
    },
    enabled: !!user?.id,
  });
};

export const useUpdateAchievementProgress = () => {
  const queryClient = useQueryClient();

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
      const { error } = await supabase.rpc('update_achievement_progress', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_category: category,
        p_new_value: newValue || null,
        p_increment: increment,
      });

      if (error) throw error;
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

      // Получаем все активные достижения
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('id')
        .eq('is_active', true);

      if (achievementsError) throw achievementsError;

      // Получаем завершенные достижения пользователя
      const { data: completedAchievements, error: completedError } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      if (completedError) throw completedError;

      const total = allAchievements?.length || 0;
      const completed = completedAchievements?.length || 0;
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
