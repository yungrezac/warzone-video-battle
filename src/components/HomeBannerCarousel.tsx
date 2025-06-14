
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useHomeBanners } from '@/hooks/useHomeBanners';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HomeBannerCarousel: React.FC = () => {
  const { data: banners, isLoading } = useHomeBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  // Логика для показа баннера не слишком навязчиво
  useEffect(() => {
    if (!banners || banners.length === 0) return;

    const currentBanner = banners[currentIndex];
    if (!currentBanner) return;

    // Проверяем localStorage для частоты показа
    const lastShownKey = `banner_${currentBanner.id}_last_shown`;
    const viewCountKey = `banner_${currentBanner.id}_view_count`;
    
    const lastShown = localStorage.getItem(lastShownKey);
    const viewCount = parseInt(localStorage.getItem(viewCountKey) || '0');
    
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Показываем банер если:
    // 1. Его не показывали больше часа
    // 2. И количество просмотров меньше чем show_frequency
    if (!lastShown || (now - parseInt(lastShown)) > oneHour) {
      if (viewCount < currentBanner.show_frequency) {
        setShowBanner(true);
        localStorage.setItem(lastShownKey, now.toString());
        localStorage.setItem(viewCountKey, (viewCount + 1).toString());
      }
    }
  }, [banners, currentIndex]);

  // Автоматическое переключение банеров
  useEffect(() => {
    if (banners && banners.length > 1 && showBanner) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 6000); // Переключение каждые 6 секунд

      return () => clearInterval(interval);
    }
  }, [banners, showBanner]);

  const nextBanner = () => {
    if (banners) {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }
  };

  const prevBanner = () => {
    if (banners) {
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }
  };

  const handleBannerClick = (linkUrl?: string) => {
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const closeBanner = () => {
    setShowBanner(false);
    // Запоминаем что пользователь закрыл банер
    if (banners && banners[currentIndex]) {
      const dismissedKey = `banner_${banners[currentIndex].id}_dismissed`;
      localStorage.setItem(dismissedKey, Date.now().toString());
    }
  };

  if (isLoading || !banners || banners.length === 0 || !showBanner) {
    return null;
  }

  const currentBanner = banners[currentIndex];
  if (!currentBanner) return null;

  return (
    <div className="mb-4 relative">
      <Card className="overflow-hidden border-0 shadow-lg relative">
        {/* Кнопка закрытия */}
        <button
          onClick={closeBanner}
          className="absolute top-2 right-2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
        >
          ×
        </button>

        <div className="relative h-40 overflow-hidden">
          <div
            className={`w-full h-full ${currentBanner.link_url ? 'cursor-pointer' : ''}`}
            onClick={() => handleBannerClick(currentBanner.link_url || undefined)}
          >
            <img
              src={currentBanner.image_url}
              alt={currentBanner.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/20 flex items-end">
              <div className="p-3 text-white">
                <h3 className="text-sm font-semibold drop-shadow-lg">
                  {currentBanner.title}
                </h3>
              </div>
            </div>
          </div>

          {/* Навигационные кнопки */}
          {banners.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white border-0 w-8 h-8 p-0"
                onClick={prevBanner}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-8 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white border-0 w-8 h-8 p-0"
                onClick={nextBanner}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Индикаторы */}
          {banners.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default HomeBannerCarousel;
