
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';

interface CategorySelectionProps {
  onComplete: () => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({ onComplete }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string>('');
  const { user } = useAuth();

  const categories = [
    { id: 'Rollers', name: 'Ролики', emoji: '🛼' },
    { id: 'BMX', name: 'БМХ', emoji: '🚲' },
    { id: 'Skateboard', name: 'Скейтборд', emoji: '🛹' }
  ];

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Используем Nominatim для геокодинга (бесплатный API)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const data = await response.json();
            
            const city = data.address?.city || data.address?.town || data.address?.village || 'Неизвестный город';
            setDetectedCity(city);
            setIsDetectingLocation(false);
          },
          (error) => {
            console.error('Ошибка геолокации:', error);
            toast.error('Не удалось определить местоположение');
            setIsDetectingLocation(false);
          }
        );
      } else {
        toast.error('Геолокация не поддерживается браузером');
        setIsDetectingLocation(false);
      }
    } catch (error) {
      console.error('Ошибка определения города:', error);
      toast.error('Ошибка определения города');
      setIsDetectingLocation(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedCategory) {
      toast.error('Выберите категорию спорта');
      return;
    }

    if (!user) {
      toast.error('Пользователь не авторизован');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          sport_category: selectedCategory,
          city: detectedCity || 'Неизвестный город'
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Настройки сохранены');
      onComplete();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      toast.error('Ошибка сохранения настроек');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Добро пожаловать!</CardTitle>
          <p className="text-center text-gray-600">
            Расскажите нам о себе для персонализации опыта
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Выбор категории спорта */}
          <div>
            <h3 className="font-semibold mb-3">Выберите ваш спорт:</h3>
            <div className="grid grid-cols-1 gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className="h-12 justify-start"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="text-xl mr-3">{category.emoji}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Определение города */}
          <div>
            <h3 className="font-semibold mb-3">Ваш город:</h3>
            {detectedCity ? (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-green-700">{detectedCity}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDetectedCity('')}
                >
                  Изменить
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={detectLocation}
                disabled={isDetectingLocation}
              >
                <MapPin className="w-4 h-4 mr-2" />
                {isDetectingLocation ? 'Определяем...' : 'Определить город'}
              </Button>
            )}
          </div>

          {/* Кнопка завершения */}
          <Button
            className="w-full"
            onClick={handleComplete}
            disabled={!selectedCategory}
          >
            Продолжить
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategorySelection;
