
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
    processPayment: checkPaymentMutation.mutateAsync,
    isProcessingPayment: checkPaymentMutation.isPending,
  };
};
