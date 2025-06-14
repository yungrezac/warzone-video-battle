
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HomeBanner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  order_index: number;
  show_frequency: number;
  created_at: string;
  updated_at: string;
}

export const useHomeBanners = () => {
  return useQuery({
    queryKey: ['home-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_banners')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as HomeBanner[];
    },
  });
};

export const useCreateHomeBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (banner: {
      title: string;
      imageUrl: string;
      linkUrl?: string;
      orderIndex: number;
      showFrequency?: number;
    }) => {
      const { data, error } = await supabase
        .from('home_banners')
        .insert({
          title: banner.title,
          image_url: banner.imageUrl,
          link_url: banner.linkUrl,
          order_index: banner.orderIndex,
          show_frequency: banner.showFrequency || 3,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-banners'] });
    },
  });
};

export const useUpdateHomeBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<HomeBanner>;
    }) => {
      const { data, error } = await supabase
        .from('home_banners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-banners'] });
    },
  });
};

export const useDeleteHomeBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('home_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-banners'] });
    },
  });
};
