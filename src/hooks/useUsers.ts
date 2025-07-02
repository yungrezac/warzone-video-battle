import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, telegram_username')
        .order('username', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};