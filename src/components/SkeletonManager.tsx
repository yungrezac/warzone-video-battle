
import React, { useEffect } from 'react';
import { useSkeletonStorage } from '@/hooks/useSkeletonStorage';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { toast } from 'sonner';

const SkeletonManager: React.FC = () => {
  const { hasDeviceStorage, hasSecureStorage } = useTelegramWebApp();
  const { 
    isStorageAvailable, 
    saveSkeletonData, 
    loadSkeletonData, 
    clearOldSkeletons 
  } = useSkeletonStorage();

  useEffect(() => {
    console.log('🦴 SkeletonManager инициализирован');
    
    // Очищаем старые скелетоны при запуске
    clearOldSkeletons();
    
    // Показываем статус хранения
    if (hasDeviceStorage) {
      toast.success('💾 Постоянное локальное хранение активно');
    }
    
    if (hasSecureStorage) {
      toast.success('🔐 Безопасное хранение активно');
    }
    
    // Сохраняем пример скелетона для тестирования
    const testSkeleton = {
      id: 'test_skeleton',
      type: 'video' as const,
      timestamp: Date.now(),
      data: {
        title: 'Загрузка видео...',
        duration: '00:00',
        views: '---',
        likes: '---'
      }
    };
    
    saveSkeletonData('test_skeleton', testSkeleton).then(success => {
      if (success) {
        console.log('✅ Тестовый скелетон сохранен');
      }
    });
    
  }, [hasDeviceStorage, hasSecureStorage, isStorageAvailable, saveSkeletonData, clearOldSkeletons]);

  // Функция для предзагрузки скелетонов
  const preloadSkeletons = async () => {
    const skeletons = [
      {
        id: 'video_skeleton',
        type: 'video' as const,
        timestamp: Date.now(),
        data: {
          title: 'Загрузка видео...',
          author: 'Загрузка...',
          duration: '00:00',
          views: '---',
          likes: '---',
          comments: '---'
        }
      },
      {
        id: 'profile_skeleton',
        type: 'profile' as const,
        timestamp: Date.now(),
        data: {
          username: 'Загрузка...',
          followers: '---',
          following: '---',
          videos: '---',
          points: '---'
        }
      },
      {
        id: 'market_skeleton',
        type: 'market' as const,
        timestamp: Date.now(),
        data: {
          title: 'Загрузка товара...',
          price: '---',
          category: 'Загрузка...',
          description: 'Загружаем описание...'
        }
      },
      {
        id: 'tournament_skeleton',
        type: 'tournament' as const,
        timestamp: Date.now(),
        data: {
          title: 'Загрузка турнира...',
          participants: '---',
          prize: '---',
          endDate: 'Загрузка...'
        }
      }
    ];

    console.log('🦴 Предзагружаем скелетоны...');
    
    for (const skeleton of skeletons) {
      await saveSkeletonData(skeleton.id, skeleton);
    }
    
    console.log('✅ Все скелетоны предзагружены и сохранены локально');
    toast.success('🦴 Скелетоны приложения сохранены локально');
  };

  useEffect(() => {
    // Предзагружаем скелетоны через 1 секунду после инициализации
    const timer = setTimeout(() => {
      preloadSkeletons();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Этот компонент работает в фоне и не рендерит UI
  return null;
};

export default SkeletonManager;
