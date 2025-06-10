
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount_points: number;
  amount_rubles: number;
  phone_number: string;
  bank_name: string;
  recipient_name: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_comment?: string;
  created_at: string;
  processed_at?: string;
}

export const useWithdrawalRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['withdrawal-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WithdrawalRequest[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateWithdrawalRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      amountPoints,
      phoneNumber,
      bankName,
      recipientName,
    }: {
      amountPoints: number;
      phoneNumber: string;
      bankName: string;
      recipientName: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('Создаем заявку на вывод:', { amountPoints, phoneNumber, bankName, recipientName });

      const amountRubles = amountPoints / 10; // 100 баллов = 10 рублей

      // Создаем заявку на вывод
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount_points: amountPoints,
          amount_rubles: amountRubles,
          phone_number: phoneNumber,
          bank_name: bankName,
          recipient_name: recipientName,
        })
        .select()
        .single();

      if (withdrawalError) {
        console.error('Ошибка создания заявки на вывод:', withdrawalError);
        throw withdrawalError;
      }

      // Списываем баллы у пользователя
      const { error: pointsError } = await supabase.rpc('update_user_points', {
        p_user_id: user.id,
        p_points_change: -amountPoints,
        p_description: `Заявка на вывод №${withdrawalData.id}`
      });

      if (pointsError) {
        console.error('Ошибка списания баллов:', pointsError);
        throw pointsError;
      }

      console.log('Заявка на вывод создана успешно');
      return withdrawalData;
    },
    onSuccess: () => {
      toast.success('Заявка на вывод создана! Средства будут переведены после одобрения администратором.');
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['points-history'] });
    },
    onError: (error) => {
      console.error('Ошибка создания заявки на вывод:', error);
      toast.error('Ошибка создания заявки на вывод');
    },
  });
};
