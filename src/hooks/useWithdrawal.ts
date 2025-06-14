
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

interface WithdrawalRequestParams {
  amount_points: number;
  amount_usdt: number;
  wallet_address: string;
}

export const useWithdrawal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createWithdrawalRequest = useMutation({
    mutationFn: async (params: WithdrawalRequestParams) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      // 1. Get current points
      const { data: userPointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .single();
      
      if (pointsError) {
        throw new Error('Не удалось получить баланс баллов.');
      }

      if (!userPointsData || userPointsData.total_points < params.amount_points) {
        throw new Error('Недостаточно баллов для вывода.');
      }
      
      // 2. Create the withdrawal request
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount_points: params.amount_points,
          amount_usdt: params.amount_usdt,
          wallet_address: params.wallet_address,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      
      // 3. Deduct points from the user
      const newTotalPoints = userPointsData.total_points - params.amount_points;
      const { error: updateError } = await supabase
        .from('user_points')
        .update({ total_points: newTotalPoints })
        .eq('user_id', user.id);

      if (updateError) {
        await supabase
          .from('withdrawal_requests')
          .update({ status: 'failed', admin_comment: 'Сбой при списании баллов' })
          .eq('id', data.id);
        throw new Error('Произошла ошибка при списании баллов. Пожалуйста, попробуйте еще раз.');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-history'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });

  const withdrawalHistory = useQuery({
    queryKey: ['withdrawal-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return {
    createWithdrawalRequest,
    withdrawalHistory: withdrawalHistory.data || [],
    isCreatingRequest: createWithdrawalRequest.isPending,
    isLoadingHistory: withdrawalHistory.isLoading,
  };
};
