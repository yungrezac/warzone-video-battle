
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Star, Award, Gem, Zap } from 'lucide-react';
import { useStoreItems, useUserPurchases, usePurchaseItem } from '@/hooks/useStoreItems';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';

const Market: React.FC = () => {
  const { data: items, isLoading: itemsLoading } = useStoreItems();
  const { data: purchases, isLoading: purchasesLoading } = useUserPurchases();
  const { data: userProfile } = useUserProfile();
  const purchaseItem = usePurchaseItem();
  const { toast } = useToast();

  const handlePurchase = async (itemId: string, price: number) => {
    try {
      await purchaseItem.mutateAsync({ itemId });
      toast({
        title: "Успешно!",
        description: "Покупка совершена",
      });
    } catch (error: any) {
      console.error('Ошибка покупки:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось совершить покупку",
        variant: "destructive",
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'badges': return <Award className="w-4 h-4" />;
      case 'frames': return <Star className="w-4 h-4" />;
      case 'emojis': return <Gem className="w-4 h-4" />;
      case 'premium': return <Zap className="w-4 h-4" />;
      default: return <ShoppingBag className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'badges': return 'bg-yellow-100 text-yellow-800';
      case 'frames': return 'bg-purple-100 text-purple-800';
      case 'emojis': return 'bg-pink-100 text-pink-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedItems = items?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>) || {};

  const categoryNames = {
    badges: 'Значки',
    frames: 'Рамки',
    emojis: 'Эмодзи',
    premium: 'Премиум'
  };

  if (itemsLoading) {
    return (
      <div className="p-3 pb-16">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              <ShoppingBag className="w-6 h-6 mr-2" />
              Магазин
            </h1>
            <p className="text-green-100 text-sm">Тратьте баллы на крутые вещи</p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-lg px-3 py-1">
              <div className="text-xs text-green-100">Ваши баллы</div>
              <div className="text-lg font-bold">{userProfile?.total_points || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            <div className="flex items-center space-x-2 mb-3">
              <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                {getCategoryIcon(category)}
              </div>
              <h2 className="text-lg font-semibold">{categoryNames[category] || category}</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {categoryItems.map(item => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getCategoryIcon(item.category)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-sm">{item.name}</h3>
                          <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                        </div>
                        <Badge variant="secondary" className={getCategoryColor(item.category)}>
                          {categoryNames[item.category] || item.category}
                        </Badge>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-semibold">{item.price} баллов</span>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handlePurchase(item.id, item.price)}
                          disabled={!userProfile || userProfile.total_points < item.price || purchaseItem.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {purchaseItem.isPending ? 'Покупка...' : 'Купить'}
                        </Button>
                      </div>
                      
                      {userProfile && userProfile.total_points < item.price && (
                        <p className="text-xs text-red-500 mt-1">Недостаточно баллов</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(groupedItems).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Магазин пуст</p>
            <p className="text-xs">Скоро здесь появятся крутые товары!</p>
          </div>
        )}

        {purchases && purchases.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Мои покупки
            </h2>
            
            <div className="space-y-2">
              {purchases.slice(0, 5).map(purchase => (
                <Card key={purchase.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1 rounded ${getCategoryColor(purchase.item?.category || 'default')}`}>
                        {getCategoryIcon(purchase.item?.category || 'default')}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{purchase.item?.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(purchase.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">-{purchase.total_points} баллов</p>
                      <p className="text-xs text-gray-500">x{purchase.quantity}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Market;
