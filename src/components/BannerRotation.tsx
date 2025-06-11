
import React, { useState, useEffect } from 'react';
import { ExternalLink, MessageCircle, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ChatBanner {
  id: string;
  title: string;
  description: string;
  url: string;
  gradient: string;
  icon: string;
  sport: string;
}

const chatBanners: ChatBanner[] = [
  {
    id: 'roller',
    title: '🛼 Чат для роллеров',
    description: 'Присоединяйся к сообществу роллеров!',
    url: 'https://t.me/tricksroller',
    gradient: 'from-blue-500 to-cyan-500',
    icon: '🛼',
    sport: 'Роллеры'
  },
  {
    id: 'bmx',
    title: '🚴 Чат для BMX',
    description: 'Все о BMX трюках и общении!',
    url: 'https://t.me/tricksbmx',
    gradient: 'from-orange-500 to-red-500',
    icon: '🚴',
    sport: 'BMX'
  },
  {
    id: 'skateboard',
    title: '🛹 Чат для скейтеров',
    description: 'Скейтбординг сообщество!',
    url: 'https://t.me/tricksSKATEBOARD',
    gradient: 'from-purple-500 to-pink-500',
    icon: '🛹',
    sport: 'Скейтеры'
  }
];

const BannerRotation: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ротация каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % chatBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleBannerClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentBanner = chatBanners[currentIndex];

  return (
    <div className="p-2 mb-2 h-[120px]">
      <Card className={`bg-gradient-to-r ${currentBanner.gradient} text-white border-0 shadow-lg transform transition-all duration-300 hover:scale-[1.02] h-full`}>
        <div className="flex items-center h-full p-3">
          <div className="text-2xl mr-3">{currentBanner.icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm leading-tight mb-1">{currentBanner.title}</h3>
            <p className="text-xs opacity-90 leading-tight mb-2">{currentBanner.description}</p>
            
            <div className="flex items-center gap-3 text-xs mb-2">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Активно</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>Общение</span>
              </div>
            </div>

            <Button 
              onClick={() => handleBannerClick(currentBanner.url)}
              variant="secondary"
              size="sm"
              className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 flex items-center gap-1 h-6 text-xs px-2"
            >
              <ExternalLink className="w-3 h-3" />
              Присоединиться
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BannerRotation;
