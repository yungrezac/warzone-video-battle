
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';

export interface UserMarketItem {
  id: string;
  user_id: string;
  target_audience: 'rollers' | 'bmx' | 'skate';
  category: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  product_url: string;
  created_at: string;
}

export type CreateUserMarketItemPayload = Omit<UserMarketItem, 'id' | 'user_id' | 'created_at'> & { is_active?: boolean };

export const useUserMarketItems = (filters: { target_audience?: string } = {}) => {
  return useQuery({
    queryKey: ['user-market-items', filters],
    queryFn: async () => {
      let query = supabase
        .from('user_market_items')
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (filters.target_audience && filters.target_audience !== 'all') {
        query = query.eq('target_audience', filters.target_audience);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Ошибка загрузки товаров от пользователей:', error);
        throw error;
      }
      return data;
    },
  });
};

export const useCreateUserMarketItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (newItem: CreateUserMarketItemPayload) => {
      if (!user?.id) {
        throw new Error('Пользователь не авторизован');
      }

      const { data, error } = await supabase
        .from('user_market_items')
        .insert({
          ...newItem,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('violates row-level security policy')) {
            throw new Error('Только премиум-пользователи могут добавлять товары. Пожалуйста, оформите подписку.');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Ваш товар успешно добавлен!');
      queryClient.invalidateQueries({ queryKey: ['user-market-items'] });
    },
    onError: (error) => {
      console.error('Ошибка создания товара:', error);
      toast.error(`Ошибка: ${error.message}`);
    },
  });
};
