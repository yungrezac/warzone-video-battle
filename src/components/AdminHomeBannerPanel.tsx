
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Image as ImageIcon, Trash2, Edit } from 'lucide-react';
import { useCreateHomeBanner, useHomeBanners, useDeleteHomeBanner, useUpdateHomeBanner } from '@/hooks/useHomeBanners';
import { useAuth } from '@/components/AuthWrapper';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Badge } from '@/components/ui/badge';

const AdminHomeBannerPanel: React.FC = () => {
  const { user } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: banners, refetch } = useHomeBanners();
  const createBannerMutation = useCreateHomeBanner();
  const deleteBannerMutation = useDeleteHomeBanner();
  const updateBannerMutation = useUpdateHomeBanner();
  
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showFrequency, setShowFrequency] = useState(3);
  const [editingBanner, setEditingBanner] = useState<string | null>(null);

  // Проверяем, является ли пользователь админом
  const isAdmin = userProfile?.telegram_username === 'rollertricksby' || 
                 userProfile?.username === 'TrickMaster' || 
                 userProfile?.telegram_username === 'TrickMaster';

  // Детальное логирование для отладки
  useEffect(() => {
    console.log('=== Отладка AdminHomeBannerPanel ===');
    console.log('user:', user);
    console.log('userProfile:', userProfile);
    console.log('isAdmin:', isAdmin);
    console.log('banners:', banners);
  }, [user, userProfile, isAdmin, banners]);

  if (profileLoading) {
    return (
      <div className="mb-6 p-4 text-center text-gray-600">
        Загрузка профиля...
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !imageUrl) {
      return;
    }

    try {
      if (editingBanner) {
        await updateBannerMutation.mutateAsync({
          id: editingBanner,
          updates: {
            title,
            image_url: imageUrl,
            link_url: linkUrl || undefined,
            show_frequency: showFrequency,
          },
        });
        setEditingBanner(null);
      } else {
        await createBannerMutation.mutateAsync({
          title,
          imageUrl,
          linkUrl: linkUrl || undefined,
          orderIndex: (banners?.length || 0) + 1,
          showFrequency,
        });
      }

      // Очищаем форму
      setTitle('');
      setImageUrl('');
      setLinkUrl('');
      setShowFrequency(3);
      
      refetch();
    } catch (error) {
      console.error('Ошибка при работе с банером:', error);
    }
  };

  const handleEdit = (banner: any) => {
    setTitle(banner.title);
    setImageUrl(banner.image_url);
    setLinkUrl(banner.link_url || '');
    setShowFrequency(banner.show_frequency);
    setEditingBanner(banner.id);
  };

  const handleDelete = async (bannerId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот банер?')) {
      try {
        await deleteBannerMutation.mutateAsync(bannerId);
        refetch();
      } catch (error) {
        console.error('Ошибка при удалении банера:', error);
      }
    }
  };

  const cancelEdit = () => {
    setEditingBanner(null);
    setTitle('');
    setImageUrl('');
    setLinkUrl('');
    setShowFrequency(3);
  };

  return (
    <Card className="mb-6 border-purple-200 bg-purple-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
          <ImageIcon className="w-5 h-5" />
          Админ панель - Банеры главной страницы
        </CardTitle>
        <CardDescription className="text-purple-600">
          Управление банерами, которые показываются на главной странице
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

          <div>
            <Label htmlFor="show-frequency">Частота показа (раз в час)</Label>
            <Input
              id="show-frequency"
              type="number"
              min="1"
              max="10"
              value={showFrequency}
              onChange={(e) => setShowFrequency(parseInt(e.target.value) || 3)}
              placeholder="3"
            />
            <p className="text-xs text-gray-500 mt-1">
              Максимальное количество показов в час одному пользователю
            </p>
          </div>

          {/* Превью изображения */}
          {imageUrl && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Превью:</Label>
              <div className="w-full h-32 bg-gray-100 rounded border overflow-hidden">
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

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={createBannerMutation.isPending || updateBannerMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {editingBanner ? (
                updateBannerMutation.isPending ? "Обновляем..." : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Обновить банер
                  </>
                )
              ) : (
                createBannerMutation.isPending ? "Создаем..." : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить банер
                  </>
                )
              )}
            </Button>
            
            {editingBanner && (
              <Button 
                type="button" 
                variant="outline"
                onClick={cancelEdit}
              >
                Отменить
              </Button>
            )}
          </div>
        </form>

        {/* Список существующих банеров */}
        {banners && banners.length > 0 && (
          <div className="mt-6 space-y-2">
            <Label className="text-sm text-gray-600">Существующие банеры:</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {banners.map((banner, index) => (
                <div key={banner.id} className="flex items-center gap-2 p-3 bg-white rounded border text-sm">
                  <div className="w-12 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img 
                      src={banner.image_url} 
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{banner.title}</div>
                    <div className="text-xs text-gray-500">
                      Частота: {banner.show_frequency}/час
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={banner.is_active ? "default" : "secondary"} className="text-xs">
                      {banner.is_active ? 'Активен' : 'Неактивен'}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(banner)}
                      className="p-1 h-auto"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(banner.id)}
                      className="p-1 h-auto text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminHomeBannerPanel;
