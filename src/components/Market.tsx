
import React from 'react';
import { ShoppingBag, Star, Gift, Crown, Zap, Settings, Package, Circle, Square, Hexagon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Market: React.FC = () => {
  const upcomingFeatures = [
    {
      title: "Премиум статус",
      description: "Эксклюзивные возможности",
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      title: "Эксклюзивные бейджи",
      description: "Уникальные награды",
      icon: Crown,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    }
  ];

  const rollerProducts = [
    {
      title: "Запчасти",
      description: "Подшипники",
      icon: Settings,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Колеса",
      description: "Разные размеры",
      icon: Circle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Рамы",
      description: "Алюминий, карбон",
      icon: Square,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Ролики",
      description: "Фрискейт, слалом",
      icon: Hexagon,
      color: "text-red-600",
      bgColor: "bg-red-100"
    }
  ];

  return (
    <div className="p-4 pb-20 max-w-4xl mx-auto">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white">Маркет</CardTitle>
              <CardDescription className="text-purple-100">
                Тратьте заработанные баллы на крутые награды!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Coming Soon Section */}
      <div className="text-center mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <Gift className="w-10 h-10 text-blue-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Скоро тут можно будет потратить баллы
        </h2>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Мы готовим для вас удивительные награды! Продолжайте участвовать в соревнованиях и копить баллы.
        </p>
      </div>

      {/* Upcoming Features */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Скоро в маркете</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingFeatures.map((feature, index) => (
            <Card key={index} className={`${feature.bgColor} ${feature.borderColor} border-2 border-dashed hover:shadow-md transition-shadow`}>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-3">
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h4 className="font-medium text-gray-800 mb-1">{feature.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                <Badge variant="outline" className="text-xs">
                  Скоро
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Roller Shop Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-blue-500 rounded-full">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl text-gray-800">
            Роллерский магазин
          </CardTitle>
          <CardDescription className="text-gray-600">
            Скоро появится возможность покупки роллерских товаров за накопленные баллы!
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {rollerProducts.map((product, index) => (
              <Card key={index} className="bg-white hover:shadow-md transition-shadow border border-gray-200">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 ${product.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <product.icon className={`w-6 h-6 ${product.color}`} />
                  </div>
                  <h5 className="font-medium text-gray-800 mb-1 text-sm">{product.title}</h5>
                  <p className="text-xs text-gray-500">{product.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="outline" className="bg-white hover:bg-blue-50 border-blue-200">
              <Package className="w-4 h-4 mr-2" />
              Уведомить о запуске
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Market;
