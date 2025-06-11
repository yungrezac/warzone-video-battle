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
  icon: React.ReactNode;
  sport: string;
}

// Улучшенные SVG иконки для каждого вида спорта
const RollerIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Роллер - силуэт человека на роликах */}
    <circle cx="16" cy="6" r="3" fill="white"/>
    {/* Тело */}
    <path d="M16 9L16 18M13 12L19 12M16 18L12 26M16 18L20 26" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    {/* Ролики на ногах */}
    <ellipse cx="11" cy="26" rx="4" ry="2" fill="white"/>
    <ellipse cx="21" cy="26" rx="4" ry="2" fill="white"/>
    {/* Колеса */}
    <circle cx="8" cy="26" r="1.5" fill="#333"/>
    <circle cx="11" cy="26" r="1.5" fill="#333"/>
    <circle cx="14" cy="26" r="1.5" fill="#333"/>
    <circle cx="18" cy="26" r="1.5" fill="#333"/>
    <circle cx="21" cy="26" r="1.5" fill="#333"/>
    <circle cx="24" cy="26" r="1.5" fill="#333"/>
  </svg>
);

const BMXIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* BMX велосипед */}
    {/* Переднее колесо */}
    <circle cx="8" cy="22" r="6" fill="none" stroke="white" strokeWidth="2"/>
    <circle cx="8" cy="22" r="1" fill="white"/>
    {/* Заднее колесо */}
    <circle cx="24" cy="22" r="6" fill="none" stroke="white" strokeWidth="2"/>
    <circle cx="24" cy="22" r="1" fill="white"/>
    {/* Рама */}
    <path d="M8 22L16 10L24 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 10L16 16L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Руль */}
    <path d="M14 8L18 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 8L16 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    {/* Седло */}
    <path d="M18 14L22 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    {/* Педали */}
    <circle cx="16" cy="18" r="2" fill="none" stroke="white" strokeWidth="1.5"/>
    <path d="M14 16L18 20M18 16L14 20" stroke="white" strokeWidth="1"/>
  </svg>
);

const SkateboardIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Скейтборд */}
    {/* Доска */}
    <ellipse cx="16" cy="16" rx="12" ry="3" fill="white"/>
    {/* Подвески */}
    <rect x="7" y="14" width="4" height="4" rx="1" fill="#333"/>
    <rect x="21" y="14" width="4" height="4" rx="1" fill="#333"/>
    {/* Колеса */}
    <circle cx="6" cy="20" r="3" fill="white" stroke="#333" strokeWidth="1"/>
    <circle cx="12" cy="20" r="3" fill="white" stroke="#333" strokeWidth="1"/>
    <circle cx="20" cy="20" r="3" fill="white" stroke="#333" strokeWidth="1"/>
    <circle cx="26" cy="20" r="3" fill="white" stroke="#333" strokeWidth="1"/>
    {/* Декоративные линии на доске */}
    <path d="M8 16L24 16M10 14L22 14M10 18L22 18" stroke="#333" strokeWidth="0.5" opacity="0.5"/>
    {/* Силуэт райдера */}
    <circle cx="16" cy="8" r="2" fill="white"/>
    <path d="M16 10L16 14M14 11L18 11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

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
    icon: <RollerIcon />,
    sport: 'Роллеры'
  },
  {
    id: 'bmx',
    title: 'Чат для BMX',
    description: 'Все о BMX трюках и общении!',
    url: 'https://t.me/tricksbmx',
    gradient: 'from-orange-500 to-red-500',
    icon: <BMXIcon />,
    sport: 'BMX'
  },
  {
    id: 'skateboard',
    title: 'Чат для скейтеров',
    description: 'Скейтбординг сообщество!',
    url: 'https://t.me/tricksSKATEBOARD',
    gradient: 'from-purple-500 to-pink-500',
    icon: <SkateboardIcon />,
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
      <Card className={`bg-gradient-to-r ${currentBanner.gradient} text-white border-0 shadow-lg transform transition-all duration-300 hover:scale-[1.02] h-full relative overflow-hidden`}>
        {/* Декоративные элементы фона */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>
        
        <div className="flex items-center h-full p-3 relative z-10">
          <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mr-3 backdrop-blur-sm">
            {currentBanner.icon}
          </div>
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
              <div className="flex items-center gap-1">
                <TelegramIcon />
                <span>Telegram</span>
              </div>
            </div>

            <Button 
              onClick={() => handleBannerClick(currentBanner.url)}
              variant="secondary"
              size="sm"
              className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 flex items-center gap-1 h-6 text-xs px-2 backdrop-blur-sm"
            >
              <TelegramIcon />
              Присоединиться
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BannerRotation;
