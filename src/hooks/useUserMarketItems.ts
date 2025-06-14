
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';

export const useUserMarketItems = () => {
  return useQuery({
    queryKey: ['user-market-items'],
    queryFn: async () => {
      console.log('Загружаем пользовательские товары...');
      
      const { data, error } = await supabase
        .from('user_market_items')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки пользовательских товаров:', error);
        throw error;
      }

      console.log('Пользовательские товары загружены:', data);
      return data;
    },
  });
};

export const useCreateUserItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      name, 
      description, 
      price, 
      category,
      target_audience,
      image_url,
      product_url 
    }: { 
      name: string; 
      description?: string; 
      price: number; 
      category: string;
      target_audience: string;
      image_url?: string;
      product_url: string;
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Создаем пользовательский товар:', { name, description, price, category, target_audience, image_url, product_url });

      const { data, error } = await supabase
        .from('user_market_items')
        .insert({
          user_id: user.id,
          name,
          description,
          price,
          category,
          target_audience,
          image_url,
          product_url,
        })
        .select()
        .single();

      if (error) {
        console.error('Ошибка создания пользовательского товара:', error);
        throw error;
      }

      console.log('Пользовательский товар создан:', data);
      return data;
    },
    onSuccess: () => {
      toast.success('Товар успешно добавлен!');
      queryClient.invalidateQueries({ queryKey: ['user-market-items'] });
    },
    onError: (error) => {
      console.error('Ошибка создания пользовательского товара:', error);
      toast.error(`Ошибка добавления товара: ${error.message}`);
    },
  });
};
