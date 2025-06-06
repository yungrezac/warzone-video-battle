
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
