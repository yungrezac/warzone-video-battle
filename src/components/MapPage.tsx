
import React from 'react';
import { MapPin, Navigation, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MapPage: React.FC = () => {
  const spots = [
    {
      id: 1,
      name: 'Парк Горького',
      address: 'ул. Крымский Вал, 9',
      rating: 4.5,
      distance: '2.1 км',
      type: 'Парк'
    },
    {
      id: 2,
      name: 'Лужники',
      address: 'Лужнецкая наб., 24',
      rating: 4.8,
      distance: '3.5 км',
      type: 'Стадион'
    },
    {
      id: 3,
      name: 'Сокольники',
      address: 'Сокольнический Вал, 1',
      rating: 4.3,
      distance: '5.2 км',
      type: 'Парк'
    }
  ];

  return (
    <div className="pb-16">
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-3">
        <h1 className="text-xl font-bold">Карта спотов</h1>
        <p className="text-green-100 text-sm">Найди лучшие места для катания</p>
      </div>

      <div className="p-3">
        <div className="bg-gray-200 rounded-lg h-48 mb-4 flex items-center justify-center">
          <div className="text-center text-gray-600">
            <MapPin className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Карта будет здесь</p>
            <p className="text-xs">Интеграция с картами</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Ближайшие споты</h2>
          <Button size="sm" variant="outline">
            <Navigation className="w-4 h-4 mr-1" />
            Фильтр
          </Button>
        </div>

        <div className="space-y-3">
          {spots.map(spot => (
            <Card key={spot.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{spot.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">{spot.address}</p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-500 mr-1" />
                      {spot.rating}
                    </div>
                    <span>{spot.distance}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {spot.type}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Navigation className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
