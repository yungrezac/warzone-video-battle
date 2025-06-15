import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useEffect } from 'react';

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
  const queryClient = useQueryClient();
  const queryKey = ['achievements'];

  useEffect(() => {
    const channel = supabase
      .channel('achievements-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'achievements' }, () => {
        queryClient.invalidateQueries({ queryKey: ['achievements'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('🏆 Загружаем все активные достижения...');
      
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('target_value', { ascending: true });

      if (error) {
        console.error('❌ Ошибка загрузки достижений:', error);
        throw error;
      }
      
      console.log('✅ Загружено достижений:', data?.length || 0);
      return data as Achievement[];
    },
  });
};

export const useUserAchievements = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const queryKey = ['user-achievements', userId];

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-achievements-changes-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_achievements', filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-achievements', userId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'achievements' }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-achievements', userId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ Пользователь не авторизован для загрузки достижений');
        throw new Error('User not authenticated');
      }

      console.log('🏆 Загружаем достижения пользователя:', user.id);

      try {
        // Получаем все активные достижения
        const { data: allAchievements, error: achievementsError } = await supabase
          .from('achievements')
          .select('*')
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('target_value', { ascending: true });

        if (achievementsError) {
          console.error('❌ Ошибка загрузки достижений:', achievementsError);
          throw achievementsError;
        }

        console.log('📊 Всего активных достижений:', allAchievements?.length || 0);

        if (!allAchievements || allAchievements.length === 0) {
          console.log('⚠️ Нет активных достижений в системе');
          return [];
        }

        // Получаем прогресс пользователя по достижениям
        const { data: userProgress, error: progressError } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', user.id);

        if (progressError) {
          console.error('❌ Ошибка загрузки прогресса:', progressError);
          throw progressError;
        }

        console.log('📈 Записей прогресса пользователя:', userProgress?.length || 0);

        // Создаем карту прогресса пользователя для быстрого доступа
        const progressMap = new Map();
        userProgress?.forEach(up => {
          progressMap.set(up.achievement_id, up);
        });

        // Находим достижения, для которых у пользователя нет записей прогресса
        const missingProgressAchievements = allAchievements.filter(achievement => 
          !progressMap.has(achievement.id)
        );

        // Создаем записи для отсутствующих достижений
        if (missingProgressAchievements.length > 0) {
          console.log('➕ Создаем записи для отсутствующих достижений:', missingProgressAchievements.length);
          
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
            console.error('❌ Ошибка создания записей прогресса:', createError);
            // Не блокируем загрузку, продолжаем с существующими данными
          } else {
            console.log('✅ Создано записей прогресса:', createdProgress?.length || 0);
            // Добавляем созданные записи к карте прогресса
            createdProgress?.forEach(cp => {
              progressMap.set(cp.achievement_id, cp);
            });
          }
        }

        // Объединяем данные - для каждого достижения создаем запись с прогрессом
        const result: UserAchievement[] = allAchievements.map(achievement => {
          const userProgress = progressMap.get(achievement.id);
          
          if (!userProgress) {
            // Если записи всё ещё нет, создаем виртуальную запись
            console.warn('⚠️ Создаем виртуальную запись для достижения:', achievement.title);
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
        });

        console.log('🎯 Финальный результат достижений:', result.length, 'записей');
        console.log('✅ Выполненных достижений:', result.filter(r => r.is_completed).length);
        
        return result;

      } catch (error) {
        console.error('❌ Общая ошибка загрузки достижений пользователя:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
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
      console.log('🔄 Обновляем прогресс достижений:', {
        category,
        newValue,
        increment
      });

      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user?.id) {
        console.error('❌ Пользователь не авторизован для обновления достижений');
        throw new Error('User not authenticated');
      }

      try {
        const { error } = await supabase.rpc('update_achievement_progress', {
          p_user_id: user.user.id,
          p_category: category,
          p_new_value: newValue || null,
          p_increment: increment,
        });

        if (error) {
          console.error('❌ Ошибка обновления достижений:', error);
          throw error;
        }

        console.log('✅ Достижения обновлены успешно для категории:', category);
        return { success: true };

      } catch (error) {
        console.error('❌ Общая ошибка обновления достижений:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log('🔄 Обновляем кэш после изменения достижений категории:', variables.category);
      
      // Обновляем кэш достижений
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['achievement-stats'] });
    },
    onError: (error, variables) => {
      console.error('❌ Ошибка в мутации обновления достижений для категории:', variables.category, error);
    },
  });
};

export const useAchievementStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['achievement-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ Пользователь не авторизован для загрузки статистики достижений');
        throw new Error('User not authenticated');
      }

      console.log('📊 Загружаем статистику достижений для пользователя:', user.id);

      try {
        // Получаем все активные достижения
        const { data: allAchievements, error: achievementsError } = await supabase
          .from('achievements')
          .select('id')
          .eq('is_active', true);

        if (achievementsError) {
          console.error('❌ Ошибка загрузки всех достижений:', achievementsError);
          throw achievementsError;
        }

        // Получаем завершенные достижения пользователя
        const { data: completedAchievements, error: completedError } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_completed', true);

        if (completedError) {
          console.error('❌ Ошибка загрузки завершенных достижений:', completedError);
          throw completedError;
        }

        const total = allAchievements?.length || 0;
        const completed = completedAchievements?.length || 0;
        const remaining = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const stats = {
          total,
          completed,
          remaining,
          completionRate,
        };

        console.log('📈 Статистика достижений:', stats);
        return stats;

      } catch (error) {
        console.error('❌ Общая ошибка загрузки статистики достижений:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000,
  });
};
