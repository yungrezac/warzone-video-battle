
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShoppingCart, Gift, Star } from 'lucide-react';
import MarketItemCard from './MarketItemCard';
import MarketItemModal from './MarketItemModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BannerCarousel from './BannerCarousel';
import { useSubscription } from '@/hooks/useSubscription';

const Market: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { isPremium } = useSubscription();

  const { data: items, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] pb-16">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Category Tabs */}
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
              {filteredItems && filteredItems.length > 0 ? (
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

      {/* Item Modal */}
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
