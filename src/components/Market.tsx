
import React, { useState } from 'react';
import { ShoppingBag, Package, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketItems } from '@/hooks/useMarketItems';
import { useAuth } from '@/components/AuthWrapper';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSubscription } from '@/hooks/useSubscription';
import AdminWinnerControl from './AdminWinnerControl';
import AdminMarketPanel from './AdminMarketPanel';
import AdminBannerPanel from './AdminBannerPanel';
import BannerCarousel from './BannerCarousel';
import MarketItemCard from './MarketItemCard';
import MarketItemModal from './MarketItemModal';
import SubscriptionModal from './SubscriptionModal';
import PremiumBadge from './PremiumBadge';
import { Loader2 } from 'lucide-react';

const Market: React.FC = () => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { data: marketItems, isLoading, error } = useMarketItems();
  const { isPremium, subscription } = useSubscription();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Правильно преобразуем изображения к типу string[]
  const processedItems = marketItems?.map(item => ({
    ...item,
    images: Array.isArray(item.images) 
      ? item.images.filter((img): img is string => typeof img === 'string')
      : []
  })) || [];

  return (
    <div className="p-4 pb-20 max-w-6xl mx-auto">
      {/* Admin Panels */}
      <AdminWinnerControl />
      <AdminBannerPanel />
      <AdminMarketPanel />

      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Header Section */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl text-white">Маркет</CardTitle>
              <CardDescription className="text-purple-100">
                Тратьте заработанные баллы на крутые награды!
              </CardDescription>
            </div>
            {/* Premium Status */}
            {isPremium && (
              <div className="text-right">
                <PremiumBadge size="md" />
                {subscription && (
                  <div className="text-xs text-purple-100 mt-1">
                    до {new Date(subscription.expires_at).toLocaleDateString('ru-RU')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Points and Premium CTA */}
          <div className="mt-4 flex items-center justify-between">
            {user && (
              <div className="p-3 bg-white/10 rounded-lg">
                <p className="text-white">
                  Ваши баллы: <span className="font-bold text-yellow-300">{userProfile?.total_points || 0}</span>
                </p>
              </div>
            )}

            {!isPremium && (
              <SubscriptionModal>
                <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg cursor-pointer hover:from-yellow-500 hover:to-orange-600 transition-all">
                  <div className="flex items-center gap-2 text-white">
                    <Crown className="w-5 h-5" />
                    <div>
                      <div className="text-sm font-medium">Получить Premium</div>
                      <div className="text-xs opacity-90">300 Stars/месяц</div>
                    </div>
                  </div>
                </div>
              </SubscriptionModal>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3">
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
            Ошибка загрузки товаров: {error.message}
          </div>
        </div>
      )}

      {/* Market Items */}
      {!isLoading && !error && (
        <>
          {processedItems && processedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {processedItems.map((item) => (
                <MarketItemCard 
                  key={item.id} 
                  item={item} 
                  onItemClick={handleItemClick}
                  isPremium={isPremium}
                />
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-gray-200">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Пока пусто
              </h2>
              
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                В маркете пока нет товаров. Администратор скоро добавит интересные награды!
              </p>
            </div>
          )}
        </>
      )}

      {/* Modal для отображения детальной информации о товаре */}
      <MarketItemModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Market;
