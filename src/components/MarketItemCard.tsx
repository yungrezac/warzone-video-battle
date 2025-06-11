
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Crown, Gift, Eye, Sparkles } from 'lucide-react';
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
    e.stopPropagation();
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
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200';
      case 'badge':
        return 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200';
    }
  };

  const primaryImage = item.images && item.images.length > 0 ? item.images[0] : null;

  return (
    <Card 
      className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 shadow-lg hover:shadow-2xl hover:-translate-y-1"
      onClick={handleCardClick}
    >
      {/* Изображение товара */}
      <div className="relative h-40 overflow-hidden">
        {primaryImage ? (
          <>
            <img
              src={primaryImage}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="h-full bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center">
            <div className="p-4 rounded-full bg-white shadow-lg">
              {getCategoryIcon()}
            </div>
          </div>
        )}
        
        {/* Индикатор множественных изображений */}
        {item.images && item.images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            +{item.images.length - 1}
          </div>
        )}

        {/* Статус покупки */}
        {isPurchased && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            ✓ Куплено
          </div>
        )}

        {/* Нет в наличии */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Нет в наличии
            </div>
          </div>
        )}

        {/* Иконка просмотра при наведении */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
            <Eye className="w-5 h-5 text-gray-700" />
          </div>
        </div>
      </div>

      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-base font-bold line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
            {item.title}
          </CardTitle>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <Badge className={`${getCategoryColor()} text-xs font-medium border`}>
              <div className="flex items-center gap-1">
                {getCategoryIcon()}
                {item.category}
              </div>
            </Badge>
          </div>
        </div>
        
        {item.subcategory && (
          <Badge variant="outline" className="text-xs w-fit bg-gray-50">
            {item.subcategory}
          </Badge>
        )}
        
        {item.description && (
          <CardDescription className="text-sm line-clamp-2 text-gray-600 leading-relaxed">
            {item.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-end px-4 pb-4">
        {/* Цена и остаток */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <div className="text-xl font-bold text-green-600 flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500" />
                {item.price.toLocaleString()}
              </div>
              <span className="text-sm text-gray-500">баллов</span>
            </div>
            {item.stock_quantity !== null && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Осталось</div>
                <div className="text-sm font-semibold text-gray-700">
                  {item.stock_quantity} шт.
                </div>
              </div>
            )}
          </div>
          
          {/* Индикатор доступности покупки */}
          {!isPurchased && (
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  canAfford ? 'bg-green-500' : 'bg-red-400'
                }`}
                style={{ width: `${Math.min((userProfile?.total_points || 0) / item.price * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full h-9 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            onClick={handleCardClick}
          >
            <Eye className="w-4 h-4 mr-2" />
            Подробнее
          </Button>
          
          <Button
            onClick={handlePurchase}
            disabled={isPurchased || !canAfford || isOutOfStock || purchaseItemMutation.isPending || !user}
            className={`w-full h-10 font-medium transition-all duration-200 ${
              isPurchased 
                ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-100" 
                : isOutOfStock
                ? "bg-gray-100 text-gray-500"
                : !canAfford
                ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-50"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
            }`}
            variant={isPurchased ? "secondary" : "default"}
          >
            {purchaseItemMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Покупаем...
              </div>
            ) : isPurchased ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                Куплено
              </div>
            ) : isOutOfStock ? (
              "Нет в наличии"
            ) : !user ? (
              "Войти в систему"
            ) : !canAfford ? (
              `Нужно еще ${(item.price - (userProfile?.total_points || 0)).toLocaleString()} баллов`
            ) : (
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Купить за {item.price.toLocaleString()}
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketItemCard;
