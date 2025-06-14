import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShoppingCart, Gift, Star, Crown, RussianRuble } from 'lucide-react';
import MarketItemCard from './MarketItemCard';
import UserMarketItemCard from './UserMarketItemCard';
import MarketItemModal from './MarketItemModal';
import AddUserItemForm from './AddUserItemForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BannerCarousel from './BannerCarousel';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserMarketItems } from '@/hooks/useUserMarketItems';
const Market: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [marketType, setMarketType] = useState<'points' | 'rubles'>('points');
  const {
    isPremium
  } = useSubscription();
  const {
    data: items,
    isLoading
  } = useQuery({
    queryKey: ['market-items'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('market_items').select('*').eq('is_active', true).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data;
    }
  });
  const {
    data: userItems,
    isLoading: isLoadingUserItems
  } = useUserMarketItems();
  const categories = [{
    id: 'all',
    name: 'Все товары',
    icon: ShoppingCart
  }, {
    id: 'equipment',
    name: 'Экипировка',
    icon: Gift
  }, {
    id: 'accessories',
    name: 'Аксессуары',
    icon: Star
  }];
  const userCategories = [{
    id: 'all',
    name: 'Все товары',
    icon: ShoppingCart
  }, {
    id: 'защита',
    name: 'Защита',
    icon: Gift
  }, {
    id: 'колеса',
    name: 'Колеса',
    icon: Star
  }, {
    id: 'подшипники',
    name: 'Подшипники',
    icon: Gift
  }, {
    id: 'одежда',
    name: 'Одежда',
    icon: Star
  }, {
    id: 'аксессуары',
    name: 'Аксессуары',
    icon: Gift
  }, {
    id: 'запчасти',
    name: 'Запчасти',
    icon: Star
  }, {
    id: 'другое',
    name: 'Другое',
    icon: Gift
  }];
  const filteredItems = items?.filter(item => selectedCategory === 'all' || item.category === selectedCategory);
  const filteredUserItems = userItems?.filter(item => selectedCategory === 'all' || item.category === selectedCategory);
  const handleItemClick = (item: any) => {
    setSelectedItem(item);
  };
  const isLoading_ = marketType === 'points' ? isLoading : isLoadingUserItems;
  if (isLoading_) {
    return <div className="flex justify-center items-center min-h-[300px] pb-16">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>;
  }
  return <div className="pb-16 p-1">
      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Market Type Tabs */}
      <div className="p-3 px-[4px]">
        <Tabs value={marketType} onValueChange={value => setMarketType(value as 'points' | 'rubles')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="points" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              За баллы
            </TabsTrigger>
            <TabsTrigger value="rubles" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <RussianRuble className="w-4 h-4" />
              За рубли
            </TabsTrigger>
          </TabsList>

          {/* Points Market */}
          <TabsContent value="points">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              

              {categories.map(category => <TabsContent key={category.id} value={category.id} className="mt-3">
                  {filteredItems && filteredItems.length > 0 ? <div className="grid grid-cols-2 gap-3">
                      {filteredItems.map(item => <MarketItemCard key={item.id} item={{
                  ...item,
                  images: Array.isArray(item.images) ? item.images as string[] : []
                }} onItemClick={handleItemClick} />)}
                    </div> : <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Товары в этой категории скоро появятся</p>
                    </div>}
                </TabsContent>)}
            </Tabs>
          </TabsContent>

          {/* Rubles Market */}
          <TabsContent value="rubles">
            {/* Add Item Form for Premium Users */}
            <AddUserItemForm />

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              

              {userCategories.map(category => <TabsContent key={category.id} value={category.id} className="mt-3">
                  {filteredUserItems && filteredUserItems.length > 0 ? <div className="grid grid-cols-2 gap-3">
                      {filteredUserItems.map(item => <UserMarketItemCard key={item.id} item={item} />)}
                    </div> : <div className="text-center py-8 text-gray-500">
                      <Crown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        {selectedCategory === 'all' ? 'Пользовательские товары скоро появятся' : 'Товары в этой категории скоро появятся'}
                      </p>
                      {isPremium && <p className="text-xs text-gray-400 mt-1">
                          Вы можете добавить свой товар используя форму выше
                        </p>}
                    </div>}
                </TabsContent>)}
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Item Modal */}
      {selectedItem && <MarketItemModal item={selectedItem} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>;
};
export default Market;