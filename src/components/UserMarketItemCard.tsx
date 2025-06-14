
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Crown, User } from 'lucide-react';
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
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      <AspectRatio ratio={1} className="relative overflow-hidden rounded-t-xl">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
        
        <div className="absolute top-1.5 right-1.5 bg-white/80 backdrop-blur-sm text-yellow-600 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
          <Crown className="w-2.5 h-2.5" />
          Premium
        </div>
      </AspectRatio>

      <div className="p-2 flex flex-col flex-1">
        <CardHeader className="p-0">
          <CardTitle className="text-xs font-bold line-clamp-2 leading-tight h-8">
            {item.name}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 mt-auto pt-2">
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <Badge className={`${getAudienceColor()} text-xs font-medium border px-1.5 py-0.5`}>
              {item.target_audience}
            </Badge>
            <Badge variant="outline" className="text-xs bg-gray-50 px-1.5 py-0.5">
              {item.category}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-gray-800">
              {item.price.toLocaleString()}<span className="text-sm font-normal text-gray-500 ml-0.5">₽</span>
            </div>
            <Button
              size="sm"
              onClick={handlePurchase}
              className="h-8 text-xs shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Купить
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default UserMarketItemCard;
