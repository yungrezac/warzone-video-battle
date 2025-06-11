
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useWithdrawal = () => {
  const createWithdrawalRequest = useMutation({
    mutationFn: async ({
      amount_points,
      phone_number,
      recipient_name,
      bank_name,
    }: {
      amount_points: number;
      phone_number: string;
      recipient_name: string;
      bank_name: string;
    }) => {
      console.log('Создаем заявку на вывод средств:', {
        amount_points,
        phone_number,
        recipient_name,
        bank_name,
      });

      const { data, error } = await supabase.rpc('create_withdrawal_request', {
        p_amount_points: amount_points,
        p_phone_number: phone_number,
        p_recipient_name: recipient_name,
        p_bank_name: bank_name,
      });

      if (error) {
        console.error('Ошибка создания заявки на вывод:', error);
        throw error;
      }

      console.log('Заявка на вывод создана:', data);
      return data;
    },
  });

  const { data: withdrawalHistory, isLoading } = useQuery({
    queryKey: ['withdrawal-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return {
    createWithdrawalRequest: createWithdrawalRequest.mutateAsync,
    isCreatingRequest: createWithdrawalRequest.isPending,
    withdrawalHistory,
    isLoadingHistory: isLoading,
  };
};
