
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';
import { useTelegramNotifications } from './useTelegramNotifications';

type UseUserSubscriptionsReturn = {
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
};

export const useUserSubscriptions = (profileUserId: string | null): UseUserSubscriptionsReturn => {
  const { user } = useAuth();
  const { sendNewSubscriberNotification } = useTelegramNotifications();
  const queryClient = useQueryClient();
  const currentUserId = user?.id;

  const subscriptionQueryKey = ['subscription-status', currentUserId, profileUserId];

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: subscriptionQueryKey,
    queryFn: async () => {
      if (!currentUserId || !profileUserId) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('subscriber_id', currentUserId)
        .eq('subscribed_to_id', profileUserId)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return data;
    },
    enabled: !!currentUserId && !!profileUserId,
  });

  const isSubscribed = !!subscription;

  const mutationOptions = {
    onSuccess: (targetUserId: string | null) => {
      queryClient.invalidateQueries({ queryKey: subscriptionQueryKey });
      if (targetUserId) {
        queryClient.invalidateQueries({ queryKey: ['other-user-profile', targetUserId] });
      }
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: ['other-user-profile', currentUserId] });
      }
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  };

  const subscribeMutation: UseMutationResult<string | null, Error, void> = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !profileUserId) throw new Error('User not authenticated or profile user id not provided');
      if (currentUserId === profileUserId) throw new Error('You cannot subscribe to yourself');

      const { error } = await supabase
        .from('user_subscriptions')
        .insert({ subscriber_id: currentUserId, subscribed_to_id: profileUserId });
      
      if (error) throw error;
      return profileUserId;
    },
    onSuccess: async (targetUserId) => {
      toast.success('Вы успешно подписались!');
      mutationOptions.onSuccess(targetUserId);
      
      if (targetUserId && user?.id) {
        try {
          const { data: subscribedToProfile, error: subscribedToProfileError } = await supabase
            .from('profiles')
            .select('telegram_id')
            .eq('id', targetUserId)
            .single();

          const { data: subscriberProfile, error: subscriberProfileError } = await supabase
            .from('profiles')
            .select('username, telegram_username')
            .eq('id', user.id)
            .single();

          if (subscribedToProfileError || subscriberProfileError) {
            console.error('Ошибка при получении профилей для уведомления:', subscribedToProfileError || subscriberProfileError);
            return;
          }
          
          if (subscribedToProfile?.telegram_id && subscriberProfile) {
            const subscriberName = subscriberProfile.username || subscriberProfile.telegram_username || 'Аноним';
            await sendNewSubscriberNotification(targetUserId, subscribedToProfile.telegram_id, subscriberName);
          }
        } catch (e) {
          console.error("Не удалось отправить уведомление о подписке", e);
        }
      }
    },
    onError: (error) => {
      toast.error(`Ошибка подписки: ${error.message}`);
    },
  });

  const unsubscribeMutation: UseMutationResult<string | null, Error, void> = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !profileUserId) throw new Error('User not authenticated or profile user id not provided');

      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('subscriber_id', currentUserId)
        .eq('subscribed_to_id', profileUserId);
        
      if (error) throw error;
      return profileUserId;
    },
    onSuccess: (targetUserId) => {
      toast.info('Вы отписались.');
      mutationOptions.onSuccess(targetUserId);
    },
    onError: (error) => {
      toast.error(`Ошибка отписки: ${error.message}`);
    },
  });

  const subscribe = (): void => {
    subscribeMutation.mutate();
  };
  
  const unsubscribe = (): void => {
    unsubscribeMutation.mutate();
  };

  return {
    isSubscribed,
    isLoading: isLoadingSubscription || subscribeMutation.isPending || unsubscribeMutation.isPending,
    subscribe,
    unsubscribe,
  };
};
