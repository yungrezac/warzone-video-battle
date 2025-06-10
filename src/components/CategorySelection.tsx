
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin, User } from 'lucide-react';

interface CategorySelectionProps {
  onComplete: () => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({ onComplete }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { id: 'Rollers', name: 'Ролики', emoji: '🛼' },
    { id: 'BMX', name: 'BMX', emoji: '🚴' },
    { id: 'Skateboard', name: 'Скейтборд', emoji: '🛹' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !city) return;

    setIsLoading(true);
    // Здесь будет логика сохранения данных пользователя
    await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация запроса
    setIsLoading(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600/90 to-purple-600/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Добро пожаловать!</CardTitle>
          <p className="text-blue-100">Расскажите немного о себе</p>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Выбор категории спорта */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-gray-800">Ваш вид спорта</Label>
              <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value={category.id} id={category.id} />
                    <Label htmlFor={category.id} className="flex items-center gap-3 cursor-pointer flex-1">
                      <span className="text-2xl">{category.emoji}</span>
                      <span className="font-medium">{category.name}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Ввод города */}
            <div className="space-y-3">
              <Label htmlFor="city" className="text-lg font-semibold text-gray-800">Ваш город</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Например: Москва"
                  className="pl-11 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={!selectedCategory || !city || isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Сохранение...
                </div>
              ) : (
                'Продолжить'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategorySelection;
