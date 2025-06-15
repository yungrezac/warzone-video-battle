
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';

type UseUserSubscriptionsReturn = {
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
};

export const useUserSubscriptions = (profileUserId?: string): UseUserSubscriptionsReturn => {
  const { user } = useAuth();
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

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !profileUserId) throw new Error('User not authenticated or profile user id not provided');
      if (currentUserId === profileUserId) throw new Error('You cannot subscribe to yourself');

      const { error } = await supabase
        .from('user_subscriptions')
        .insert({ subscriber_id: currentUserId, subscribed_to_id: profileUserId });
      
      if (error) throw error;
      return profileUserId;
    },
    onSuccess: (targetUserId) => {
      toast.success('Вы успешно подписались!');
      queryClient.invalidateQueries({ queryKey: subscriptionQueryKey });
      queryClient.invalidateQueries({ queryKey: ['other-user-profile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['other-user-profile', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      toast.error(`Ошибка подписки: ${error.message}`);
    },
  });

  const unsubscribeMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: subscriptionQueryKey });
      queryClient.invalidateQueries({ queryKey: ['other-user-profile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['other-user-profile', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      toast.error(`Ошибка отписки: ${error.message}`);
    },
  });

  const subscribe = () => subscribeMutation.mutate();
  const unsubscribe = () => unsubscribeMutation.mutate();

  return {
    isSubscribed,
    isLoading: isLoadingSubscription || subscribeMutation.isPending || unsubscribeMutation.isPending,
    subscribe,
    unsubscribe,
  };
};
