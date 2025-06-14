
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type Database } from '@/integrations/supabase/types';
import { useEffect } from 'react';

export type HomeBanner = Database['public']['Tables']['home_banners']['Row'];

const fetchHomeBanners = async () => {
  const { data, error } = await supabase
    .from('home_banners')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching home banners:', error);
    throw new Error(error.message);
  }
  return data;
};

export const useHomeBanners = () => {
  const queryClient = useQueryClient();
  const queryKey = ['home_banners'];

  useEffect(() => {
    const channel = supabase
      .channel('home-banners-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'home_banners' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: fetchHomeBanners,
    staleTime: Infinity,
  });
};
