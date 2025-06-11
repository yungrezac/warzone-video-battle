
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWithdrawal = () => {
  const queryClient = useQueryClient();

  const createWithdrawalRequest = useMutation({
    mutationFn: async ({ amount_points }: { amount_points: number }) => {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          amount_points,
          amount_rubles: amount_points * 0.1, // 1 балл = 0.1 рубля
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Заявка на вывод создана успешно!');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
    },
    onError: (error: any) => {
      console.error('Ошибка создания заявки на вывод:', error);
      toast.error('Ошибка при создании заявки на вывод');
    },
  });

  return {
    createWithdrawalRequest,
  };
};
