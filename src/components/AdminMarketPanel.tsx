
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Settings } from 'lucide-react';
import { useCreateMarketItem } from '@/hooks/useMarketItems';
import { useAuth } from '@/components/AuthWrapper';

const AdminMarketPanel: React.FC = () => {
  const { user } = useAuth();
  const createItemMutation = useCreateMarketItem();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('general');
  const [stockQuantity, setStockQuantity] = useState('');

  // Проверяем, является ли пользователь админом
  const isAdmin = user?.telegram_username === 'rollertricksby' || 
                 user?.username === 'TrickMaster' || 
                 user?.telegram_username === 'TrickMaster';

  if (!isAdmin) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !price) {
      return;
    }

    try {
      await createItemMutation.mutateAsync({
        title,
        description: description || undefined,
        price: parseInt(price),
        category,
        stockQuantity: stockQuantity ? parseInt(stockQuantity) : undefined,
      });

      // Очищаем форму
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('general');
      setStockQuantity('');
    } catch (error) {
      console.error('Ошибка создания товара:', error);
    }
  };

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
          <Settings className="w-5 h-5" />
          Админ панель - Управление маркетом
        </CardTitle>
        <CardDescription className="text-orange-600">
          Добавление новых товаров в маркет
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Название товара *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название товара"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="price">Цена в баллах *</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="100"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание товара..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Категория</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Общее</SelectItem>
                  <SelectItem value="premium">Премиум</SelectItem>
                  <SelectItem value="badge">Бейджи</SelectItem>
                  <SelectItem value="equipment">Экипировка</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="stock">Количество (оставьте пустым для безлимита)</Label>
              <Input
                id="stock"
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="Безлимит"
                min="1"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={createItemMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {createItemMutation.isPending ? (
              "Добавляем..."
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Добавить товар
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminMarketPanel;
