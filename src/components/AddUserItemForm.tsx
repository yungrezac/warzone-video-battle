
import React, { useState } from 'react';
import { useCreateUserItem } from '@/hooks/useUserMarketItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Crown } from 'lucide-react';
import { useAuth } from '@/components/AuthWrapper';
import { useSubscription } from '@/hooks/useSubscription';

const AddUserItemForm: React.FC = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    target_audience: '',
    image_url: '',
    product_url: '',
  });

  const createItemMutation = useCreateUserItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isPremium) return;

    await createItemMutation.mutateAsync({
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      target_audience: formData.target_audience,
      image_url: formData.image_url || undefined,
      product_url: formData.product_url,
    });

    // Сбрасываем форму
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      target_audience: '',
      image_url: '',
      product_url: '',
    });
    setIsOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isPremium) {
    return (
      <Card className="mb-4 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardContent className="p-4 text-center">
          <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            Добавление товаров доступно только для Premium пользователей
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        Добавить товар
      </Button>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-600" />
          Добавить товар
        </CardTitle>
        <CardDescription>
          Заполните информацию о товаре для продажи
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Целевая аудитория */}
          <div>
            <Label htmlFor="target_audience">Для кого товар</Label>
            <Select value={formData.target_audience} onValueChange={(value) => handleInputChange('target_audience', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите аудиторию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="роллеры">Роллеры</SelectItem>
                <SelectItem value="бмх">БМХ</SelectItem>
                <SelectItem value="скейт">Скейт</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Категория товара */}
          <div>
            <Label htmlFor="category">Категория товара</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="защита">Защита</SelectItem>
                <SelectItem value="колеса">Колеса</SelectItem>
                <SelectItem value="подшипники">Подшипники</SelectItem>
                <SelectItem value="одежда">Одежда</SelectItem>
                <SelectItem value="аксессуары">Аксессуары</SelectItem>
                <SelectItem value="запчасти">Запчасти</SelectItem>
                <SelectItem value="другое">Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Название */}
          <div>
            <Label htmlFor="name">Название товара</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Введите название товара"
              required
            />
          </div>

          {/* Описание */}
          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Описание товара (необязательно)"
              rows={3}
            />
          </div>

          {/* Цена */}
          <div>
            <Label htmlFor="price">Цена (в рублях)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Ссылка на изображение */}
          <div>
            <Label htmlFor="image_url">Ссылка на изображение</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
              placeholder="https://example.com/image.jpg (необязательно)"
            />
          </div>

          {/* Ссылка на товар */}
          <div>
            <Label htmlFor="product_url">Ссылка на товар</Label>
            <Input
              id="product_url"
              type="url"
              value={formData.product_url}
              onChange={(e) => handleInputChange('product_url', e.target.value)}
              placeholder="https://shop.example.com/product"
              required
            />
          </div>

          {/* Кнопки */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createItemMutation.isPending}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              {createItemMutation.isPending ? 'Добавляем...' : 'Добавить товар'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddUserItemForm;
