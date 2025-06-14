
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTournamentBanners = () => {
  return useQuery({
    queryKey: ['tournament-banners'],
    queryFn: async () => {
      console.log('Загружаем баннеры турниров...');

      const { data: banners, error } = await supabase
        .from('tournament_banners')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки баннеров турниров:', error);
        throw error;
      }

      console.log('Баннеры турниров загружены:', banners);
      return banners;
    },
  });
};
