
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('📞 Вызываем Edge Function для создания инвойса...');

      const { data, error } = await supabase.functions.invoke('create-subscription-invoice', {
        body: {
          user_id: user.id
        }
      });

      if (error) {
        console.error('❌ Ошибка Edge Function:', error);
        throw error;
      }

      console.log('✅ Ответ Edge Function:', data);
      return data;
    },
    onSuccess: () => {
      console.log('✅ Инвойс успешно создан');
    },
    onError: (error) => {
      console.error('❌ Ошибка создания инвойса:', error);
    },
  });

  const checkPaymentMutation = useMutation({
    mutationFn: async (paymentData: { telegram_payment_charge_id: string, telegram_invoice_payload: string }) => {
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          user_id: user?.id,
          ...paymentData
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });

  return {
    subscription,
    isLoading,
    isPremium: !!subscription,
    createInvoice: createInvoiceMutation.mutateAsync,
    isCreatingInvoice: createInvoiceMutation.isPending,
    processPayment: checkPaymentMutation.mutateAsync,
    isProcessingPayment: checkPaymentMutation.isPending,
  };
};
