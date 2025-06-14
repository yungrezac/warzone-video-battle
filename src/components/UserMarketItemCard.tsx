
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface UserMarketItemCardProps {
  item: any; // Using 'any' to accommodate joined profile data
}

const UserMarketItemCard: React.FC<UserMarketItemCardProps> = ({ item }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleBuyClick = () => {
    window.open(item.product_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <div className="aspect-square w-full overflow-hidden">
        <img
          src={item.image_url || '/placeholder.svg'}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-3 flex flex-col flex-grow">
        <h3 className="font-semibold text-sm truncate">{item.name}</h3>
        <p className="text-xs text-gray-500 mb-2">{item.category}</p>
        <div className="mt-auto flex items-end justify-between">
          <p className="font-bold text-lg text-gray-800">{formatPrice(item.price)}</p>
          <Button size="sm" onClick={handleBuyClick}>
            Купить
            <ExternalLink className="w-3 h-3 ml-1.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserMarketItemCard;
