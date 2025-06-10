
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export interface PointsHistoryItem {
  id: string;
  points_change: number;
  operation_type: 'earned' | 'spent' | 'withdrawal' | 'refund';
  description: string;
  reference_id?: string;
  created_at: string;
}

export const usePointsHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['points-history', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('Загружаем историю баллов для пользователя:', user.id);

      const { data, error } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки истории баллов:', error);
        throw error;
      }

      console.log('История баллов загружена:', data);
      return data as PointsHistoryItem[];
    },
    enabled: !!user?.id,
  });
};
