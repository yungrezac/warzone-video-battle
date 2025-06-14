
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useSubscription } from '@/hooks/useSubscription';

interface WithdrawalRequestParams {
  amount_points: number;
  amount_usdt: number;
  wallet_address: string;
  withdrawal_type: 'bank' | 'crypto';
  // Банковские реквизиты (опциональны для crypto)
  recipient_name?: string;
  phone_number?: string;
  bank_name?: string;
}

export const useWithdrawal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isPremium } = useSubscription();

  // Коэффициенты конвертации
  const POINTS_TO_RUBLE_RATE = 0.1; // 1 балл = 0.1 рубля
  const POINTS_TO_USDT_RATE = 0.00001; // 100000 баллов = 1 USDT

  const createWithdrawalRequest = useMutation({
    mutationFn: async (params: WithdrawalRequestParams) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      // Проверка на премиум для крипто-вывода
      if (params.withdrawal_type === 'crypto' && !isPremium) {
        throw new Error('Вывод в USDT доступен только для Premium пользователей');
      }

      // Минимальная сумма для вывода в USDT
      if (params.withdrawal_type === 'crypto' && params.amount_points < 100000) {
        throw new Error('Минимальная сумма для вывода: 100000 баллов');
      }

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount_points: params.amount_points,
          amount_rubles: params.withdrawal_type === 'bank' ? params.amount_usdt : null,
          amount_usdt: params.withdrawal_type === 'crypto' ? params.amount_usdt : null,
          recipient_name: params.recipient_name || null,
          phone_number: params.phone_number || null,
          bank_name: params.bank_name || null,
          wallet_address: params.wallet_address || null,
          withdrawal_type: params.withdrawal_type,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
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
    pointToRubleRate: POINTS_TO_RUBLE_RATE,
    pointToUsdtRate: POINTS_TO_USDT_RATE,
    isPremium,
  };
};
