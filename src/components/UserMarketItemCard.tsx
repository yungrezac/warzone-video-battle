import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, User, Crown } from 'lucide-react';
import { useAuth } from '@/components/AuthWrapper';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface UserMarketItemCardProps {
  item: {
    id: string;
    name: string;
    description?: string;
    price: number;
    category: string;
    target_audience: string;
    image_url?: string;
    product_url: string;
    user_id: string;
  };
}

const UserMarketItemCard: React.FC<UserMarketItemCardProps> = ({ item }) => {
  const { user } = useAuth();

  const handlePurchase = () => {
    window.open(item.product_url, '_blank');
  };

  const getAudienceColor = () => {
    switch (item.target_audience) {
      case 'роллеры':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'бмх':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'скейт':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Изображение товара */}
      <AspectRatio ratio={1} className="relative overflow-hidden rounded-t-xl">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center">
            <div className="p-3 rounded-full bg-white shadow-lg">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        )}
        
        {/* Премиум индикатор */}
        <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Crown className="w-2.5 h-2.5" />
          Premium
        </div>
      </AspectRatio>

      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-start justify-between gap-1.5 mb-1.5">
          <CardTitle className="text-xs font-bold line-clamp-2 leading-tight">
            {item.name}
          </CardTitle>
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <Badge className={`${getAudienceColor()} text-xs font-medium border px-1.5 py-0.5`}>
              {item.target_audience}
            </Badge>
          </div>
        </div>
        
        <Badge variant="outline" className="text-xs w-fit bg-gray-50 px-1.5 py-0.5">
          {item.category}
        </Badge>
        
        {item.description && (
          <CardDescription className="text-xs line-clamp-2 text-gray-600 leading-relaxed">
            {item.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-end px-3 pb-3">
        {/* Цена */}
        <div className="mb-3">
          <div className="flex items-center justify-center mb-1.5">
            <div className="flex items-center gap-0.5">
              <div className="text-sm font-bold text-green-600 flex items-center gap-0.5">
                <span className="text-xs">{item.price.toLocaleString()}</span>
              </div>
              <span className="text-xs text-gray-500">₽</span>
            </div>
          </div>
        </div>

        {/* Кнопка покупки */}
        <Button
          onClick={handlePurchase}
          className="w-full h-8 font-medium text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Перейти к товару
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserMarketItemCard;
