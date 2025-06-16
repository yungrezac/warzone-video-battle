
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useTelegramWebApp } from './useTelegramWebApp';

interface StarSubscriptionData {
  subscription_id: string;
  status: 'active' | 'cancelled' | 'expired';
  expires_at: string;
  is_recurring: boolean;
}

export const useStarSubscriptions = () => {
  const { user } = useAuth();
  const { webApp } = useTelegramWebApp();
  const queryClient = useQueryClient();

  // Получение информации о звездных подписках
  const { data: starSubscriptions, isLoading } = useQuery({
    queryKey: ['star-subscriptions', user?.id],
    queryFn: async (): Promise<StarSubscriptionData[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('subscription_type', 'premium')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(sub => ({
        subscription_id: sub.id,
        status: sub.status as 'active' | 'cancelled' | 'expired',
        expires_at: sub.expires_at,
        is_recurring: true // Все новые подписки рекуррентные
      }));
    },
    enabled: !!user,
  });

  // Отмена подписки через Telegram API
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      if (!user?.telegram_id) {
        throw new Error('Telegram ID not found');
      }

      // Вызываем Telegram API для отмены подписки
      const { data, error } = await supabase.functions.invoke('cancel-star-subscription', {
        body: {
          user_id: user.id,
          subscription_id: subscriptionId,
          telegram_user_id: user.telegram_id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['star-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  return {
    starSubscriptions,
    isLoading,
    hasActiveSubscription: starSubscriptions?.some(sub => sub.status === 'active') || false,
    cancelSubscription: cancelSubscriptionMutation.mutateAsync,
    isCancelling: cancelSubscriptionMutation.isPending,
  };
};
