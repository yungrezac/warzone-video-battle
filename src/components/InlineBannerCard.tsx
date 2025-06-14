
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { HomeBanner } from '@/hooks/useHomeBanners';

interface InlineBannerCardProps {
  banner: HomeBanner;
}

const InlineBannerCard: React.FC<InlineBannerCardProps> = ({ banner }) => {
  const handleClick = () => {
    if (banner.link_url) {
      if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openLink) {
        window.Telegram.WebApp.openLink(banner.link_url);
      } else {
        window.open(banner.link_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <Card 
      className={`overflow-hidden rounded-xl shadow-md transition-transform duration-200 hover:scale-[1.02] ${banner.link_url ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <img src={banner.image_url} alt={banner.title} className="w-full h-auto object-cover aspect-[2/1]" />
      </CardContent>
    </Card>
  );
};

export default InlineBannerCard;
