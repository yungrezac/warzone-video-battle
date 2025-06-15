
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export const useTournamentBanners = () => {
  const queryClient = useQueryClient();
  const queryKey = ['tournament-banners'];

  useEffect(() => {
    const channel = supabase
      .channel('tournament-banners-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_banners' }, () => {
        queryClient.invalidateQueries({ queryKey: ['tournament-banners'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey,
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
    staleTime: Infinity,
  });
};
