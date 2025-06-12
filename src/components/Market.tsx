
import React, { useState } from 'react';
import { useMarketItems } from '@/hooks/useMarketItems';
import { useMarketBanners } from '@/hooks/useMarketBanners';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/components/AuthWrapper';
import { Loader2, Crown, Star } from 'lucide-react';
import MarketItemCard from './MarketItemCard';
import MarketItemModal from './MarketItemModal';
import BannerCarousel from './BannerCarousel';
import CategorySelector from './CategorySelector';
import SubscriptionModal from './SubscriptionModal';
import PremiumBadge from './PremiumBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Market: React.FC = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const { data: banners } = useMarketBanners();
  const { data: items, isLoading, error } = useMarketItems();

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  // Фильтруем товары по категории
  const filteredItems = items ? items.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  ) : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] pb-16">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 pb-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          Ошибка загрузки товаров: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Header with Premium Status */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold">Магазин</h1>
          {isPremium ? (
            <div className="flex items-center gap-2">
              <PremiumBadge size="sm" />
              <span className="text-xs opacity-90">Premium активен</span>
            </div>
          ) : (
            <SubscriptionModal>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/20 border border-white/30"
              >
                <Crown className="w-4 h-4 mr-1" />
                Premium
              </Button>
            </SubscriptionModal>
          )}
        </div>
        <p className="text-sm opacity-90">
          Обменивайте баллы на крутые призы
        </p>
      </div>

      <div className="p-3">
        {/* Premium Promotion for non-premium users */}
        {!isPremium && (
          <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Crown className="w-5 h-5 mr-2" />
                Получите Premium!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-2">
                    • Участие в турнирах с призами до 100,000₽
                  </p>
                  <p className="text-sm opacity-90 mb-2">
                    • Вывод баллов на карту
                  </p>
                  <p className="text-sm opacity-90">
                    • Эксклюзивные товары
                  </p>
                </div>
                <SubscriptionModal>
                  <Button 
                    className="bg-white hover:bg-gray-100 text-orange-600 font-bold"
                    size="sm"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    300 ⭐
                  </Button>
                </SubscriptionModal>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Banners */}
        {banners && banners.length > 0 && (
          <div className="mb-4">
            <BannerCarousel banners={banners} />
          </div>
        )}

        {/* Category Selector */}
        <div className="mb-4">
          <CategorySelector 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Items Grid */}
        {filteredItems && filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => (
              <MarketItemCard
                key={item.id}
                item={{
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  price: item.price,
                  category: item.category,
                  subcategory: item.subcategory,
                  stock_quantity: item.stock_quantity,
                  images: Array.isArray(item.images) ? item.images : []
                }}
                onClick={handleItemClick}
                isPremiumItem={item.category === 'premium'}
                userHasPremium={isPremium}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-gray-100 rounded-lg p-6">
              <p className="text-gray-500">Товары в данной категории пока отсутствуют</p>
            </div>
          </div>
        )}
      </div>

      {/* Item Modal */}
      {selectedItem && (
        <MarketItemModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Market;
