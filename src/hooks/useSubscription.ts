
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

      console.log('Проверяем подписку для пользователя:', user.id);

      // Сначала проверяем активную подписку
      const { data: activeSubscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error('Ошибка получения подписки:', subError);
        throw subError;
      }

      // Также проверяем профиль на премиум статус
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, premium_expires_at')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Ошибка получения профиля:', profileError);
      }

      console.log('Активная подписка:', activeSubscription);
      console.log('Профиль премиум:', profile);

      // Возвращаем активную подписку или данные из профиля
      return activeSubscription || (profile?.is_premium && profile?.premium_expires_at && new Date(profile.premium_expires_at) > new Date() ? {
        id: 'profile-premium',
        user_id: user.id,
        status: 'active',
        expires_at: profile.premium_expires_at,
        subscription_type: 'premium'
      } : null);
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

  const isPremium = !!subscription;
  
  console.log('Статус премиум:', isPremium, 'Подписка:', subscription);

  return {
    subscription,
    isLoading,
    isPremium,
    createInvoice: createInvoiceMutation.mutateAsync,
    isCreatingInvoice: createInvoiceMutation.isPending,
    processPayment: checkPaymentMutation.mutateAsync,
    isProcessingPayment: checkPaymentMutation.isPending,
  };
};
