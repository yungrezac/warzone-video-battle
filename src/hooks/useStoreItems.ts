
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export interface StoreItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category: string;
  is_available: boolean;
  created_at: string;
}

export interface UserPurchase {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  total_points: number;
  created_at: string;
  item?: StoreItem;
}

export const useStoreItems = () => {
  return useQuery({
    queryKey: ['store-items'],
    queryFn: async () => {
      console.log('Загружаем товары магазина');
      
      const { data: items, error } = await supabase
        .from('store_items')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки товаров:', error);
        throw error;
      }
      
      console.log('Товары загружены:', items);
      return items as StoreItem[];
    },
  });
};

export const useUserPurchases = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-purchases', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('Загружаем покупки пользователя:', user.id);

      const { data: purchases, error } = await supabase
        .from('user_purchases')
        .select(`
          *,
          item:store_items(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки покупок:', error);
        throw error;
      }
      
      console.log('Покупки загружены:', purchases);
      return purchases as UserPurchase[];
    },
    enabled: !!user?.id,
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

      // Получаем информацию о товаре
      const { data: item, error: itemError } = await supabase
        .from('store_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      if (!item.is_available) {
        throw new Error('Товар недоступен');
      }

      const totalCost = item.price * quantity;

      // Проверяем баланс пользователя
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .single();

      if (pointsError) throw pointsError;

      if (!userPoints || userPoints.total_points < totalCost) {
        throw new Error('Недостаточно баллов для покупки');
      }

      // Создаем запись о покупке
      const { data: purchase, error: purchaseError } = await supabase
        .from('user_purchases')
        .insert({
          user_id: user.id,
          item_id: itemId,
          quantity,
          total_points: totalCost,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Списываем баллы
      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          total_points: userPoints.total_points - totalCost,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      console.log('Покупка совершена:', purchase);
      return purchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};
