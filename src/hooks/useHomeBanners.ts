
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type Database } from '@/integrations/supabase/types';

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
  return useQuery({
    queryKey: ['home_banners'],
    queryFn: fetchHomeBanners,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
