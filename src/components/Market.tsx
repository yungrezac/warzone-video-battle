
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShoppingCart, Gift, Star, CreditCard } from 'lucide-react';
import MarketItemCard from './MarketItemCard';
import MarketItemModal from './MarketItemModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BannerCarousel from './BannerCarousel';
import UserMarketplace from './UserMarketplace';

const Market: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { data: items, isLoading: isLoadingPointsItems } = useQuery({
    queryKey: ['market-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_items')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const categories = [
    { id: 'all', name: 'Все товары', icon: ShoppingCart },
    { id: 'equipment', name: 'Экипировка', icon: Gift },
    { id: 'accessories', name: 'Аксессуары', icon: Star },
  ];

  const filteredItems = items?.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  );

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
  };

  const PointsMarketplace = () => (
    <div className="p-3">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3">
            {categories.map(category => {
              const IconComponent = category.icon;
              return (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="flex items-center gap-1 text-xs"
                >
                  <IconComponent className="w-3 h-3" />
                  {category.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map(category => (
            <TabsContent key={category.id} value={category.id} className="mt-3">
               {isLoadingPointsItems ? (
                  <div className="flex justify-center items-center min-h-[200px]">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : filteredItems && filteredItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {filteredItems.map(item => (
                    <MarketItemCard 
                      key={item.id}
                      item={{
                        ...item,
                        images: Array.isArray(item.images) ? (item.images as string[]) : []
                      }}
                      onItemClick={handleItemClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Товары в этой категории скоро появятся</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
  );

  return (
    <div className="pb-16 p-1">
      <BannerCarousel />
      
      <Tabs defaultValue="points" className="w-full p-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="points" className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-500"/>
            За баллы
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-green-500"/>
            От пользователей
          </TabsTrigger>
        </TabsList>
        <TabsContent value="points">
          <PointsMarketplace />
        </TabsContent>
        <TabsContent value="users" className="p-1 mt-2">
          <UserMarketplace />
        </TabsContent>
      </Tabs>

      {selectedItem && (
        <MarketItemModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default Market;
