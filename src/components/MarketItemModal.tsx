
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Star, Crown, Gift, X } from 'lucide-react';
import { usePurchaseItem, useUserPurchases } from '@/hooks/useMarketItems';
import { useAuth } from '@/components/AuthWrapper';
import { useUserProfile } from '@/hooks/useUserProfile';

interface MarketItemModalProps {
  item: {
    id: string;
    title: string;
    description?: string;
    price: number;
    category: string;
    subcategory?: string;
    stock_quantity?: number;
    images?: string[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const MarketItemModal: React.FC<MarketItemModalProps> = ({ item, isOpen, onClose }) => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { data: userPurchases } = useUserPurchases();
  const purchaseItemMutation = usePurchaseItem();

  if (!item) return null;

  const handlePurchase = async () => {
    if (!user) return;
    await purchaseItemMutation.mutateAsync({ itemId: item.id });
    onClose();
  };

  const isPurchased = userPurchases?.some(purchase => purchase.item_id === item.id);
  const canAfford = (userProfile?.total_points || 0) >= item.price;
  const isOutOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'premium':
        return <Star className="w-5 h-5" />;
      case 'badge':
        return <Crown className="w-5 h-5" />;
      default:
        return <Gift className="w-5 h-5" />;
    }
  };

  const getCategoryColor = () => {
    switch (item.category) {
      case 'premium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'badge':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getCategoryIcon()}
              <DialogTitle className="text-xl">{item.title}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getCategoryColor()}`}>
                {item.category}
              </Badge>
              {item.subcategory && (
                <Badge variant="outline" className="text-xs">
                  {item.subcategory}
                </Badge>
              )}
            </div>
          </div>
          
          {item.description && (
            <DialogDescription className="text-base">
              {item.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Изображения товара */}
            {item.images && item.images.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Изображения</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {item.images.map((imageUrl, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={`${item.title} ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.currentTarget.parentElement!.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Информация о товаре */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">Цена</span>
                  <div className="text-2xl font-bold text-green-600">
                    {item.price} баллов
                  </div>
                </div>
                
                {item.stock_quantity !== null && (
                  <div className="text-right">
                    <span className="text-sm text-gray-600">В наличии</span>
                    <div className="text-lg font-semibold">
                      {item.stock_quantity} шт.
                    </div>
                  </div>
                )}
              </div>

              {/* Информация о балансе пользователя */}
              {user && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Ваши баллы:</span>
                    <span className="font-bold text-blue-800">
                      {userProfile?.total_points || 0}
                    </span>
                  </div>
                  {!canAfford && !isPurchased && (
                    <div className="mt-2 text-sm text-red-600">
                      Нужно еще {item.price - (userProfile?.total_points || 0)} баллов
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Кнопка покупки */}
        <div className="pt-4 border-t">
          <Button
            onClick={handlePurchase}
            disabled={isPurchased || !canAfford || isOutOfStock || purchaseItemMutation.isPending || !user}
            className="w-full h-12 text-base"
            variant={isPurchased ? "secondary" : "default"}
          >
            {purchaseItemMutation.isPending ? (
              "Покупаем..."
            ) : isPurchased ? (
              "Куплено"
            ) : isOutOfStock ? (
              "Нет в наличии"
            ) : !user ? (
              "Войдите для покупки"
            ) : !canAfford ? (
              `Нужно ${item.price - (userProfile?.total_points || 0)} баллов`
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Купить за {item.price} баллов
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarketItemModal;
