
import React, { useState, useEffect } from 'react';
import { ExternalLink, MessageCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import WinnerAnnouncement from './WinnerAnnouncement';

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
    title: '🛼 Чат TRICKS для роллеров',
    description: 'Присоединяйся к сообществу роллеров! Делись трюками, общайся и учись новому',
    url: 'https://t.me/tricksroller',
    gradient: 'from-blue-500 to-cyan-500',
    icon: '🛼',
    sport: 'Роллеры'
  },
  {
    id: 'bmx',
    title: '🚴 Чат TRICKS для BMX',
    description: 'Все о BMX трюках! Советы, обучение и крутые видео от профи',
    url: 'https://t.me/tricksbmx',
    gradient: 'from-orange-500 to-red-500',
    icon: '🚴',
    sport: 'BMX'
  },
  {
    id: 'skateboard',
    title: '🛹 Чат TRICKS для скейтеров',
    description: 'Скейтбординг сообщество! Изучай новые трюки и находи друзей',
    url: 'https://t.me/tricksSKATEBOARD',
    gradient: 'from-purple-500 to-pink-500',
    icon: '🛹',
    sport: 'Скейтеры'
  }
];

interface BannerRotationProps {
  onViewWinner?: (videoId: string) => void;
}

const BannerRotation: React.FC<BannerRotationProps> = ({ onViewWinner }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWinner, setShowWinner] = useState(true);

  // Ротация каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      if (showWinner) {
        setShowWinner(false);
        setCurrentIndex(0);
      } else {
        const nextIndex = (currentIndex + 1) % chatBanners.length;
        if (nextIndex === 0) {
          setShowWinner(true);
        } else {
          setCurrentIndex(nextIndex);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, showWinner]);

  const handleBannerClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (showWinner) {
    return (
      <div className="transition-all duration-500 ease-in-out">
        <WinnerAnnouncement onViewWinner={onViewWinner} />
      </div>
    );
  }

  const currentBanner = chatBanners[currentIndex];

  return (
    <div className="p-2 mb-4 transition-all duration-500 ease-in-out">
      <Card className={`bg-gradient-to-r ${currentBanner.gradient} text-white border-0 shadow-lg transform transition-all duration-300 hover:scale-[1.02]`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <span className="text-lg">{currentBanner.icon}</span>
            Telegram сообщества
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <h3 className="font-bold text-white mb-1">{currentBanner.title}</h3>
            <p className="text-sm opacity-90 leading-relaxed">{currentBanner.description}</p>
          </div>
          
          <div className="flex items-center gap-4 text-sm mb-3">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>Активное сообщество</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>Ежедневные обсуждения</span>
            </div>
          </div>

          <Button 
            onClick={() => handleBannerClick(currentBanner.url)}
            variant="secondary"
            size="sm"
            className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Присоединиться к чату
          </Button>

          {/* Индикаторы ротации */}
          <div className="flex justify-center gap-1 mt-3">
            <div className="w-2 h-2 rounded-full bg-white opacity-60"></div>
            {chatBanners.map((_, index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerRotation;
