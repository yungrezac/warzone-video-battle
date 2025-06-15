
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFollowList = (userId: string | null, type: 'followers' | 'following') => {
  return useQuery({
    queryKey: ['follow-list', userId, type],
    queryFn: async () => {
      if (!userId) return [];

      let query;
      if (type === 'followers') {
        // Get users who follow `userId`
        query = supabase
          .from('user_subscriptions')
          .select('profile:subscriber_id(id, username, avatar_url, first_name, last_name, telegram_username)')
          .eq('subscribed_to_id', userId);
      } else {
        // Get users `userId` follows
        query = supabase
          .from('user_subscriptions')
          .select('profile:subscribed_to_id(id, username, avatar_url, first_name, last_name, telegram_username)')
          .eq('subscriber_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const users = data.map((item: any) => item.profile).filter(p => p !== null);
      return users;
    },
    enabled: !!userId,
  });
};
