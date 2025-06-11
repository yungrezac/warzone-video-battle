
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
  sport: string;
}

const TelegramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.944 2.1L18.472 19.334C18.213 20.403 17.566 20.687 16.665 20.174L11.834 16.751L9.515 18.984C9.232 19.267 8.997 19.502 8.452 19.502L8.828 14.584L17.788 6.611C18.212 6.235 17.694 6.022 17.122 6.398L6.159 13.362L1.423 11.876C0.378 11.546 0.354 10.806 1.661 10.293L20.518 1.413C21.373 1.083 22.108 1.599 21.944 2.1Z" fill="currentColor"/>
  </svg>
);

const chatBanners: ChatBanner[] = [
  {
    id: 'roller',
    title: 'Чат для роллеров',
    description: 'Присоединяйся к сообществу роллеров!',
    url: 'https://t.me/tricksroller',
    gradient: 'from-blue-500 to-cyan-500',
    sport: 'Роллеры'
  },
  {
    id: 'bmx',
    title: 'Чат для BMX',
    description: 'Все о BMX трюках и общении!',
    url: 'https://t.me/tricksbmx',
    gradient: 'from-orange-500 to-red-500',
    sport: 'BMX'
  },
  {
    id: 'skateboard',
    title: 'Чат для скейтеров',
    description: 'Скейтбординг сообщество!',
    url: 'https://t.me/tricksSKATEBOARD',
    gradient: 'from-purple-500 to-pink-500',
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
    <div className="p-3 mb-4">
      <Card className={`bg-gradient-to-r ${currentBanner.gradient} text-white border-0 shadow-lg transform transition-all duration-500 hover:scale-[1.02] min-h-[140px] relative overflow-hidden rounded-xl`}>
        {/* Улучшенные декоративные элементы фона */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10"></div>
        <div className="absolute top-1/2 right-8 w-32 h-1 bg-white/10 rounded-full transform -rotate-45"></div>
        
        <div className="flex items-center min-h-[140px] p-5 relative z-10">
          <div className="flex-1 min-w-0 space-y-3">
            {/* Заголовок с улучшенной типографикой */}
            <h3 className="font-bold text-xl leading-tight text-white drop-shadow-sm">
              {currentBanner.title}
            </h3>
            
            {/* Описание */}
            <p className="text-base opacity-95 leading-relaxed text-white/90 max-w-[280px]">
              {currentBanner.description}
            </p>
            
            {/* Информационные теги */}
            <div className="flex items-center gap-4 text-sm text-white/80">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>Активно</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <span>Общение</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TelegramIcon />
                <span>Telegram</span>
              </div>
            </div>

            {/* Кнопка присоединения */}
            <div className="pt-2">
              <Button 
                onClick={() => handleBannerClick(currentBanner.url)}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex items-center gap-2 h-10 text-sm px-4 backdrop-blur-sm transition-all duration-200 hover:scale-105 min-w-[160px] justify-center shadow-sm"
              >
                <TelegramIcon />
                Присоединиться
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Индикаторы ротации */}
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {chatBanners.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};

export default BannerRotation;
