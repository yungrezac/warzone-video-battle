import React from 'react';
import { Card } from '@/components/ui/card';
import { useMarketBanners } from '@/hooks/useMarketBanners';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
const BannerCarousel: React.FC = () => {
  const {
    data: banners,
    isLoading
  } = useMarketBanners();
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Фильтруем только активные банеры
  const activeBanners = banners?.filter(banner => banner.is_active) || [];

  // Автоматическое переключение банеров
  React.useEffect(() => {
    if (activeBanners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % activeBanners.length);
      }, 5000); // Переключение каждые 5 секунд

      return () => clearInterval(interval);
    }
  }, [activeBanners.length]);
  const nextBanner = () => {
    setCurrentIndex(prev => (prev + 1) % activeBanners.length);
  };
  const prevBanner = () => {
    setCurrentIndex(prev => (prev - 1 + activeBanners.length) % activeBanners.length);
  };
  const handleBannerClick = (linkUrl?: string) => {
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };
  if (isLoading || !activeBanners.length) {
    return null;
  }
  return <div className="mb-6 relative">
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="relative h-48 overflow-hidden">
          {activeBanners.map((banner, index) => <div key={banner.id} className={`absolute inset-0 transition-transform duration-500 ease-in-out ${index === currentIndex ? 'translate-x-0' : index < currentIndex ? '-translate-x-full' : 'translate-x-full'}`}>
              <div className={`w-full h-full ${banner.link_url ? 'cursor-pointer' : ''}`} onClick={() => handleBannerClick(banner.link_url || undefined)}>
                <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" onError={e => {
              e.currentTarget.style.display = 'none';
            }} />
                <div className="absolute inset-0 bg-black/20 flex items-end">
                  <div className="p-4 text-white">
                    <h3 className="text-lg font-semibold drop-shadow-lg">
                      {banner.title}
                    </h3>
                  </div>
                </div>
              </div>
            </div>)}

          {/* Навигационные кнопки */}
          {activeBanners.length > 1 && <>
              
              
            </>}

          {/* Индикаторы */}
          {activeBanners.length > 1 && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {activeBanners.map((_, index) => <button key={index} className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white' : 'bg-white/50'}`} onClick={() => setCurrentIndex(index)} />)}
            </div>}
        </div>
      </Card>
    </div>;
};
export default BannerCarousel;