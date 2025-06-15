
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';

export const useUserSubscriptions = (profileUserId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentUserId = user?.id;

  const subscriptionQueryKey = ['subscription-status', currentUserId, profileUserId];

  // Проверяем, подписан ли текущий пользователь на просматриваемый профиль
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

  // Мутация для подписки
  const subscribeMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!currentUserId) throw new Error('User not authenticated');
      if (currentUserId === targetUserId) throw new Error('You cannot subscribe to yourself');

      const { error } = await supabase
        .from('user_subscriptions')
        .insert({ subscriber_id: currentUserId, subscribed_to_id: targetUserId });
      
      if (error) throw error;
    },
    onSuccess: (_, targetUserId) => {
      toast.success('Вы успешно подписались!');
      queryClient.invalidateQueries({ queryKey: ['subscription-status', currentUserId, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['other-user-profile', targetUserId] });
       queryClient.invalidateQueries({ queryKey: ['other-user-profile', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      toast.error(`Ошибка подписки: ${error.message}`);
    },
  });

  // Мутация для отписки
  const unsubscribeMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!currentUserId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('subscriber_id', currentUserId)
        .eq('subscribed_to_id', targetUserId);
        
      if (error) throw error;
    },
    onSuccess: (_, targetUserId) => {
      toast.info('Вы отписались.');
      queryClient.invalidateQueries({ queryKey: ['subscription-status', currentUserId, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['other-user-profile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['other-user-profile', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      toast.error(`Ошибка отписки: ${error.message}`);
    },
  });

  return {
    isSubscribed,
    isLoadingSubscription,
    subscribe: subscribeMutation.mutate,
    unsubscribe: unsubscribeMutation.mutate,
  };
};
