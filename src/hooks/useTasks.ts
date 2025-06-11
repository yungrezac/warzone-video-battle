
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export interface Task {
  id: string;
  title: string;
  description: string;
  telegram_channel_url: string;
  reward_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTask {
  id: string;
  user_id: string;
  task_id: string;
  completed_at: string;
  points_awarded: number;
  task?: Task;
}

// Хук для получения всех активных заданий
export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
  });
};

// Хук для получения выполненных заданий пользователя
export const useUserTasks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-tasks', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_tasks')
        .select(`
          *,
          task:tasks(*)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data as UserTask[];
    },
    enabled: !!user,
  });
};

// Хук для выполнения задания
export const useCompleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase.rpc('complete_task', {
        p_task_id: taskId
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; points_awarded?: number };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to complete task');
      }

      return result;
    },
    onSuccess: () => {
      // Обновляем кэш
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

// Хук для создания задания (только для админов)
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Хук для обновления задания (только для админов)
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
