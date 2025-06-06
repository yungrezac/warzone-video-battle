
import React, { useState } from 'react';
import { ShoppingBag, Star, Filter, Search, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  category: 'skates' | 'protection' | 'accessories' | 'clothing';
  isNew?: boolean;
  isOnSale?: boolean;
  isFavorite?: boolean;
  brand: string;
}

const Market: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const products: Product[] = [
    {
      id: '1',
      name: 'Rollerblade Twister Edge',
      price: 24990,
      originalPrice: 29990,
      rating: 4.8,
      reviewCount: 124,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop',
      category: 'skates',
      isOnSale: true,
      brand: 'Rollerblade'
    },
    {
      id: '2',
      name: 'K2 FIT 84 Pro',
      price: 18990,
      rating: 4.6,
      reviewCount: 89,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop',
      category: 'skates',
      isNew: true,
      brand: 'K2'
    },
    {
      id: '3',
      name: 'Защита Rollerblade Pro',
      price: 5990,
      rating: 4.5,
      reviewCount: 67,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop',
      category: 'protection',
      brand: 'Rollerblade'
    },
    {
      id: '4',
      name: 'Шлем Triple Eight',
      price: 3990,
      rating: 4.7,
      reviewCount: 45,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
      category: 'protection',
      isFavorite: true,
      brand: 'Triple Eight'
    },
    {
      id: '5',
      name: 'Подшипники Bones Reds',
      price: 2490,
      rating: 4.9,
      reviewCount: 156,
      image: 'https://images.unsplash.com/photo-1609205258634-34ad1a7dea8b?w=200&h=200&fit=crop',
      category: 'accessories',
      brand: 'Bones'
    },
    {
      id: '6',
      name: 'Футболка RollerClub',
      price: 1590,
      originalPrice: 1990,
      rating: 4.3,
      reviewCount: 28,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop',
      category: 'clothing',
      isOnSale: true,
      brand: 'RollerClub'
    }
  ];

  const categories = [
    { id: 'all', name: 'Все' },
    { id: 'skates', name: 'Ролики' },
    { id: 'protection', name: 'Защита' },
    { id: 'accessories', name: 'Аксессуары' },
    { id: 'clothing', name: 'Одежда' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const handleAddToCart = (productId: string) => {
    console.log('Добавляем в корзину:', productId);
  };

  const handleToggleFavorite = (productId: string) => {
    console.log('Переключаем избранное:', productId);
  };

  return (
    <div className="pb-16">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-3">
        <h1 className="text-xl font-bold flex items-center">
          <ShoppingBag className="w-5 h-5 mr-2" />
          Магазин
        </h1>
        <p className="text-orange-100 text-sm">Все для роллерспорта</p>
      </div>

      <div className="p-3">
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full mb-4">
          <TabsList className="grid w-full grid-cols-5">
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs">
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map(product => (
            <Card key={product.id} className="p-2 relative">
              {product.isNew && (
                <Badge className="absolute top-2 left-2 bg-green-500 text-white text-xs z-10">
                  Новинка
                </Badge>
              )}
              {product.isOnSale && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs z-10">
                  Скидка
                </Badge>
              )}
              
              <button
                onClick={() => handleToggleFavorite(product.id)}
                className="absolute top-2 right-2 z-10 p-1"
              >
                <Heart 
                  className={`w-4 h-4 ${product.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                />
              </button>

              <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                <p className="text-xs text-gray-500">{product.brand}</p>
                
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs text-gray-600">{product.rating}</span>
                  <span className="text-xs text-gray-500">({product.reviewCount})</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-500 line-through ml-1">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleAddToCart(product.id)}
                  className="w-full mt-2 h-8 text-xs"
                >
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  В корзину
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Товары не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Market;
