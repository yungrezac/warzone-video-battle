
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Crown, Gift, Eye } from 'lucide-react';
import { usePurchaseItem, useUserPurchases } from '@/hooks/useMarketItems';
import { useAuth } from '@/components/AuthWrapper';
import { useUserProfile } from '@/hooks/useUserProfile';

interface MarketItemCardProps {
  item: {
    id: string;
    title: string;
    description?: string;
    price: number;
    category: string;
    subcategory?: string;
    stock_quantity?: number;
    images?: string[];
  };
  onItemClick: (item: any) => void;
}

const MarketItemCard: React.FC<MarketItemCardProps> = ({ item, onItemClick }) => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { data: userPurchases } = useUserPurchases();
  const purchaseItemMutation = usePurchaseItem();

  const handlePurchase = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем открытие модального окна
    if (!user) return;
    await purchaseItemMutation.mutateAsync({ itemId: item.id });
  };

  const handleCardClick = () => {
    onItemClick(item);
  };

  const isPurchased = userPurchases?.some(purchase => purchase.item_id === item.id);
  const canAfford = (userProfile?.total_points || 0) >= item.price;
  const isOutOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'premium':
        return <Star className="w-4 h-4" />;
      case 'badge':
        return <Crown className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getCategoryColor = () => {
    switch (item.category) {
      case 'premium':
        return 'bg-yellow-100 text-yellow-800';
      case 'badge':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Получаем первое изображение для отображения
  const primaryImage = item.images && item.images.length > 0 ? item.images[0] : null;

  return (
    <Card 
      className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Изображение товара */}
      {primaryImage ? (
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={primaryImage}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {item.images && item.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              +{item.images.length - 1}
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center">
            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          {getCategoryIcon()}
        </div>
      )}

      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
            {item.title}
          </CardTitle>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <Badge className={`${getCategoryColor()} text-xs`}>
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
          <CardDescription className="text-sm line-clamp-2">
            {item.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-green-600">
              {item.price} баллов
            </span>
            {item.stock_quantity !== null && (
              <span className="text-sm text-gray-500">
                Осталось: {item.stock_quantity}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCardClick}
          >
            <Eye className="w-4 h-4 mr-2" />
            Подробнее
          </Button>
          
          <Button
            onClick={handlePurchase}
            disabled={isPurchased || !canAfford || isOutOfStock || purchaseItemMutation.isPending || !user}
            className="w-full"
            variant={isPurchased ? "secondary" : "default"}
          >
            {purchaseItemMutation.isPending ? (
              "Покупаем..."
            ) : isPurchased ? (
              "Куплено"
            ) : isOutOfStock ? (
              "Нет в наличии"
            ) : !user ? (
              "Войти"
            ) : !canAfford ? (
              `Нужно ${item.price - (userProfile?.total_points || 0)} баллов`
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Купить
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketItemCard;
