
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

interface WithdrawalRequestParams {
  amount_points: number;
  amount_rubles: number;
  recipient_name: string;
  phone_number: string;
  bank_name: string;
}

export const useWithdrawal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createWithdrawalRequest = useMutation({
    mutationFn: async (params: WithdrawalRequestParams) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount_points: params.amount_points,
          amount_rubles: params.amount_rubles,
          recipient_name: params.recipient_name,
          phone_number: params.phone_number,
          bank_name: params.bank_name,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-history'] });
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
