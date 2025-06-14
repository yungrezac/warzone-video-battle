
import React from 'react';
import { Card } from '@/components/ui/card';
import { useMarketBanners } from '@/hooks/useMarketBanners';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const BannerCarousel: React.FC = () => {
  const {
    data: banners,
    isLoading
  } = useMarketBanners();
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  // Фильтруем только активные банеры
  const activeBanners = banners?.filter(banner => banner.is_active) || [];

  // Автоматическое переключение банеров
  React.useEffect(() => {
    if (!api || activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000); // Переключение каждые 5 секунд

    return () => clearInterval(interval);
  }, [api, activeBanners.length]);

  React.useEffect(() => {
    if (!api) return;
    
    const onSelect = () => {
      if (api) {
        setCurrent(api.selectedScrollSnap());
      }
    };
    
    api.on('select', onSelect);
    setCurrent(api.selectedScrollSnap());
    
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const handleBannerClick = (linkUrl?: string) => {
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading || !activeBanners.length) {
    return null;
  }

  return (
    <div className="mb-6">
      <Card className="overflow-hidden border-0 shadow-lg">
        <Carousel 
          setApi={setApi} 
          className="w-full"
          opts={{
            align: "start",
            loop: activeBanners.length > 1,
          }}
        >
          <CarouselContent className="-ml-0">
            {activeBanners.map(banner => (
              <CarouselItem key={banner.id} className="pl-0">
                <div className="relative h-48">
                  <div
                    className={`w-full h-full ${banner.link_url ? 'cursor-pointer' : ''}`}
                    onClick={() => handleBannerClick(banner.link_url || undefined)}
                  >
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-end">
                      <div className="p-4 text-white">
                        <h3 className="text-lg font-semibold drop-shadow-lg">
                          {banner.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Индикаторы */}
          {activeBanners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {activeBanners.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${index === current ? 'bg-white' : 'bg-white/50'}`}
                  onClick={() => api?.scrollTo(index)}
                />
              ))}
            </div>
          )}
        </Carousel>
      </Card>
    </div>
  );
};

export default BannerCarousel;
