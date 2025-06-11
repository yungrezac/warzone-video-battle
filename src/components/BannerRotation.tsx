
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

// Векторные SVG иконки на основе загруженных изображений
const RollerIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Роллер - ботинок с колесами */}
    <path d="M8 20h16c1.5 0 2.5 1 2.5 2.5v1c0 1.5-1 2.5-2.5 2.5H8c-1.5 0-2.5-1-2.5-2.5v-1C5.5 21 6.5 20 8 20z" fill="white" stroke="white" strokeWidth="2"/>
    {/* Верхняя часть ботинка */}
    <path d="M10 20V14c0-2 1.5-4 4-4h4c2 0 3 1.5 3 3v7" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Застежки */}
    <circle cx="13" cy="15" r="1" fill="rgba(255,255,255,0.8)"/>
    <circle cx="16" cy="13" r="1" fill="rgba(255,255,255,0.8)"/>
    <circle cx="19" cy="15" r="1" fill="rgba(255,255,255,0.8)"/>
    {/* Колеса */}
    <circle cx="9" cy="26" r="3" fill="white" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
    <circle cx="14" cy="26" r="3" fill="white" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
    <circle cx="18" cy="26" r="3" fill="white" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
    <circle cx="23" cy="26" r="3" fill="white" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
    {/* Центры колес */}
    <circle cx="9" cy="26" r="1" fill="rgba(255,255,255,0.7)"/>
    <circle cx="14" cy="26" r="1" fill="rgba(255,255,255,0.7)"/>
    <circle cx="18" cy="26" r="1" fill="rgba(255,255,255,0.7)"/>
    <circle cx="23" cy="26" r="1" fill="rgba(255,255,255,0.7)"/>
  </svg>
);

const BMXIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* BMX байк с райдером */}
    {/* Заднее колесо */}
    <circle cx="7" cy="22" r="5" fill="none" stroke="white" strokeWidth="2.5"/>
    <circle cx="7" cy="22" r="1.5" fill="white"/>
    {/* Переднее колесо */}
    <circle cx="25" cy="22" r="5" fill="none" stroke="white" strokeWidth="2.5"/>
    <circle cx="25" cy="22" r="1.5" fill="white"/>
    {/* Рама */}
    <path d="M7 22L16 12L25 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 12L16 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M16 18L22 20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Руль */}
    <path d="M14 10L18 10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M16 10L16 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Седло */}
    <ellipse cx="19" cy="15" rx="2.5" ry="1" fill="white"/>
    {/* Педали */}
    <circle cx="16" cy="18" r="1.5" fill="none" stroke="white" strokeWidth="2"/>
    {/* Райдер (голова и шлем) */}
    <circle cx="16" cy="6" r="2.5" fill="white"/>
    <path d="M14 4h4c1 0 1.5 0.5 1.5 1.5v1c0 1-0.5 1.5-1.5 1.5h-4c-1 0-1.5-0.5-1.5-1.5v-1C12.5 4.5 13 4 14 4z" fill="rgba(255,255,255,0.8)"/>
    {/* Тело */}
    <path d="M16 8.5L16 12M14 9L18 9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SkateboardIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Скейтборд с райдером */}
    {/* Доска */}
    <ellipse cx="16" cy="18" rx="10" ry="2.5" fill="white" stroke="rgba(255,255,255,0.8)" strokeWidth="1"/>
    {/* Декоративные полосы на доске */}
    <path d="M8 18L24 18M10 16.5L22 16.5M10 19.5L22 19.5" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8"/>
    {/* Подвески */}
    <rect x="9" y="16.5" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.9)"/>
    <rect x="20" y="16.5" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.9)"/>
    {/* Колеса */}
    <circle cx="7" cy="22" r="2.5" fill="white" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
    <circle cx="13" cy="22" r="2.5" fill="white" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
    <circle cx="19" cy="22" r="2.5" fill="white" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
    <circle cx="25" cy="22" r="2.5" fill="white" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
    {/* Райдер */}
    <circle cx="16" cy="8" r="2" fill="white"/>
    {/* Тело в движении */}
    <path d="M16 10L15 14L17 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 14L13 16M17 14L19 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    {/* Руки */}
    <path d="M15 11L12 13M17 11L20 13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Линии движения */}
    <path d="M4 12L6 12M5 14L7 14M26 10L28 10M27 12L29 12" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
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
