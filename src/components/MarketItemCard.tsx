
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Crown, Gift } from 'lucide-react';
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
    stock_quantity?: number;
  };
}

const MarketItemCard: React.FC<MarketItemCardProps> = ({ item }) => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { data: userPurchases } = useUserPurchases();
  const purchaseItemMutation = usePurchaseItem();

  const handlePurchase = async () => {
    if (!user) {
      return;
    }

    await purchaseItemMutation.mutateAsync({ itemId: item.id });
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon()}
            <CardTitle className="text-base">{item.title}</CardTitle>
          </div>
          <Badge className={`${getCategoryColor()} text-xs`}>
            {item.category}
          </Badge>
        </div>
        {item.description && (
          <CardDescription className="text-sm">
            {item.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between">
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

        <Button
          onClick={handlePurchase}
          disabled={isPurchased || !canAfford || isOutOfStock || purchaseItemMutation.isPending}
          className="w-full"
          variant={isPurchased ? "secondary" : "default"}
        >
          {purchaseItemMutation.isPending ? (
            "Покупаем..."
          ) : isPurchased ? (
            "Куплено"
          ) : isOutOfStock ? (
            "Нет в наличии"
          ) : !canAfford ? (
            `Нужно ${item.price - (userProfile?.total_points || 0)} баллов`
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Купить
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MarketItemCard;
