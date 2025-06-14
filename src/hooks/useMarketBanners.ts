
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';
import { useEffect } from 'react';

export const useMarketBanners = () => {
  const queryClient = useQueryClient();
  const queryKey = ['market-banners'];

  useEffect(() => {
    const channel = supabase
      .channel('market-banners-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market_banners' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('Загружаем банеры маркета...');
      
      const { data, error } = await supabase
        .from('market_banners')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Ошибка загрузки банеров:', error);
        throw error;
      }

      console.log('Банеры маркета загружены:', data);
      return data;
    },
    staleTime: Infinity,
  });
};

export const useCreateMarketBanner = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      title, 
      imageUrl,
      linkUrl,
      orderIndex
    }: { 
      title: string; 
      imageUrl: string;
      linkUrl?: string;
      orderIndex: number;
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Создаем банер:', { title, imageUrl, linkUrl, orderIndex });

      const { data, error } = await supabase
        .from('market_banners')
        .insert({
          title,
          image_url: imageUrl,
          link_url: linkUrl,
          order_index: orderIndex,
        })
        .select()
        .single();

      if (error) {
        console.error('Ошибка создания банера:', error);
        throw error;
      }

      console.log('Банер создан:', data);
      return data;
    },
    onSuccess: () => {
      toast.success('Банер успешно добавлен!');
      queryClient.invalidateQueries({ queryKey: ['market-banners'] });
    },
    onError: (error) => {
      console.error('Ошибка создания банера:', error);
      toast.error(`Ошибка создания банера: ${error.message}`);
    },
  });
};
