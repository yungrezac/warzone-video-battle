
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Crown, Gift, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/AuthWrapper';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import ComingSoonModal from './ComingSoonModal';

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
    image_url?: string;
  };
}

const MarketItemCard: React.FC<MarketItemCardProps> = ({ item }) => {
  const [isComingSoonModalOpen, setComingSoonModalOpen] = useState(false);
  const { user } = useAuth();

  const handlePurchase = (e: React.MouseEvent) => {
    e.stopPropagation();
    setComingSoonModalOpen(true);
  };

  const isOutOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'premium':
        return <Star className="w-3 h-3" />;
      case 'badge':
        return <Crown className="w-3 h-3" />;
      default:
        return <Gift className="w-3 h-3" />;
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

  const primaryImage = (item.images && item.images.length > 0 ? item.images[0] : item.image_url) || null;

  return (
    <>
      <Card 
        className="h-full flex flex-col overflow-hidden transition-all duration-300 group hover:shadow-xl hover:-translate-y-1"
      >
        <AspectRatio ratio={1} className="relative overflow-hidden rounded-t-lg">
          {primaryImage ? (
            <>
              <img
                src={primaryImage}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="h-full bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center">
              <div className="p-3 rounded-full bg-white shadow-lg">
                {getCategoryIcon()}
              </div>
            </div>
          )}
          
          {item.images && item.images.length > 1 && (
            <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              +{item.images.length - 1}
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Нет в наличии
              </div>
            </div>
          )}
        </AspectRatio>

        <div className="p-2 flex flex-col flex-1">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight h-10">
              {item.title}
            </CardTitle>
          </CardHeader>
        
          <CardContent className="p-0 mt-auto pt-2">
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <Badge className={`${getCategoryColor()} text-xs font-medium border px-1.5 py-0.5`}>
                <div className="flex items-center gap-0.5">
                  {getCategoryIcon()}
                  <span className="text-xs">{item.category}</span>
                </div>
              </Badge>
              {item.subcategory && (
                <Badge variant="outline" className="text-xs w-fit bg-gray-50 px-1.5 py-0.5">
                  {item.subcategory}
                </Badge>
              )}
            </div>
          
            <Button
              onClick={handlePurchase}
              disabled={isOutOfStock || !user}
              size="sm"
              className={`w-full h-9 text-sm font-medium transition-all duration-200 mt-2 ${
                isOutOfStock
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : ""
              }`}
            >
              {isOutOfStock ? (
                'Нет в наличии'
              ) : !user ? (
                "Войти"
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Купить за {item.price.toLocaleString()}</span>
                  <span className="font-bold text-amber-500 text-base">Б</span>
                </div>
              )}
            </Button>
          </CardContent>
        </div>
      </Card>
      <ComingSoonModal isOpen={isComingSoonModalOpen} onClose={() => setComingSoonModalOpen(false)} />
    </>
  );
};

export default MarketItemCard;
