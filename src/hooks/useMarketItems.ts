import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';
import { useEffect } from 'react';

// Type for the purchase function response
interface PurchaseResponse {
  success: boolean;
  error?: string;
  message?: string;
  total_cost?: number;
}

export const useMarketItems = () => {
  const queryClient = useQueryClient();
  const queryKey = ['market-items'];

  useEffect(() => {
    const channel = supabase
      .channel('market-items-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market_items' }, () => {
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
      console.log('Загружаем товары маркета...');
      
      const { data, error } = await supabase
        .from('market_items')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки товаров:', error);
        throw error;
      }

      console.log('Товары маркета загружены:', data);
      return data;
    },
  });
};

export const usePurchaseItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ itemId, quantity = 1 }: { itemId: string; quantity?: number }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Покупаем товар:', itemId, 'количество:', quantity);

      const { data, error } = await supabase.rpc('purchase_item', {
        p_item_id: itemId,
        p_quantity: quantity
      });

      if (error) {
        console.error('Ошибка покупки:', error);
        throw error;
      }

      const response = data as unknown as PurchaseResponse;

      if (!response.success) {
        throw new Error(response.error || 'Purchase failed');
      }

      return response;
    },
    onSuccess: (data) => {
      console.log('Покупка успешна:', data);
      toast.success(`Покупка завершена! Потрачено ${data.total_cost} баллов`);
      queryClient.invalidateQueries({ queryKey: ['market-items'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-purchases'] });
    },
    onError: (error) => {
      console.error('Ошибка покупки:', error);
      toast.error(`Ошибка покупки: ${error.message}`);
    },
  });
};

export const useCreateMarketItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      title, 
      description, 
      price, 
      category,
      subcategory,
      stockQuantity,
      images 
    }: { 
      title: string; 
      description?: string; 
      price: number; 
      category: string;
      subcategory?: string;
      stockQuantity?: number;
      images?: string[];
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Создаем товар:', { title, description, price, category, subcategory, stockQuantity, images });

      const { data, error } = await supabase
        .from('market_items')
        .insert({
          title,
          description,
          price,
          category,
          subcategory,
          stock_quantity: stockQuantity,
          images: images || [],
        })
        .select()
        .single();

      if (error) {
        console.error('Ошибка создания товара:', error);
        throw error;
      }

      console.log('Товар создан:', data);
      return data;
    },
    onSuccess: () => {
      toast.success('Товар успешно добавлен в маркет!');
      queryClient.invalidateQueries({ queryKey: ['market-items'] });
    },
    onError: (error) => {
      console.error('Ошибка создания товара:', error);
      toast.error(`Ошибка создания товара: ${error.message}`);
    },
  });
};

export const useUserPurchases = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['user-purchases', user?.id];

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`user-purchases-changes-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_purchases', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id, queryKey]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('Загружаем покупки пользователя:', user.id);

      const { data, error } = await supabase
        .from('user_purchases')
        .select(`
          *,
          market_items (
            title,
            description,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки покупок:', error);
        throw error;
      }

      console.log('Покупки пользователя загружены:', data);
      return data;
    },
    enabled: !!user,
  });
};
