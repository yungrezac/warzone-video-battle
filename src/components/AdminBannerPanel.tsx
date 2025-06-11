
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Settings, X, Image as ImageIcon } from 'lucide-react';
import { useCreateMarketBanner, useMarketBanners } from '@/hooks/useMarketBanners';
import { useAuth } from '@/components/AuthWrapper';

const AdminBannerPanel: React.FC = () => {
  const { user } = useAuth();
  const { data: banners } = useMarketBanners();
  const createBannerMutation = useCreateMarketBanner();
  
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Проверяем, является ли пользователь админом
  const isAdmin = user?.telegram_username === 'rollertricksby' || 
                 user?.username === 'TrickMaster' || 
                 user?.telegram_username === 'TrickMaster';

  if (!isAdmin) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !imageUrl) {
      return;
    }

    try {
      await createBannerMutation.mutateAsync({
        title,
        imageUrl,
        linkUrl: linkUrl || undefined,
        orderIndex: (banners?.length || 0) + 1,
      });

      // Очищаем форму
      setTitle('');
      setImageUrl('');
      setLinkUrl('');
    } catch (error) {
      console.error('Ошибка создания банера:', error);
    }
  };

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
          <ImageIcon className="w-5 h-5" />
          Админ панель - Управление банерами
        </CardTitle>
        <CardDescription className="text-blue-600">
          Создание и управление банерами для маркета
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="banner-title">Название банера *</Label>
            <Input
              id="banner-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название банера"
              required
            />
          </div>

          <div>
            <Label htmlFor="banner-image">URL изображения *</Label>
            <Input
              id="banner-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              required
            />
          </div>

          <div>
            <Label htmlFor="banner-link">Ссылка при клике (необязательно)</Label>
            <Input
              id="banner-link"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* Превью изображения */}
          {imageUrl && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Превью:</Label>
              <div className="w-full h-48 bg-gray-100 rounded border overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="Превью банера"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '';
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={createBannerMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {createBannerMutation.isPending ? (
              "Создаем..."
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Добавить банер
              </>
            )}
          </Button>
        </form>

        {/* Список существующих банеров */}
        {banners && banners.length > 0 && (
          <div className="mt-6 space-y-2">
            <Label className="text-sm text-gray-600">Существующие банеры:</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {banners.map((banner, index) => (
                <div key={banner.id} className="flex items-center gap-2 p-2 bg-white rounded border text-sm">
                  <span className="text-gray-500">#{index + 1}</span>
                  <span className="flex-1 truncate">{banner.title}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {banner.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminBannerPanel;
