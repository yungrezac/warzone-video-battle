
import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Camera, MapPin, Settings } from 'lucide-react';
import { useTelegramShare } from '@/hooks/useTelegramShare';
import { useTelegramLocation } from '@/hooks/useTelegramLocation';
import { useTelegramSettings } from '@/hooks/useTelegramSettings';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { cn } from '@/lib/utils';

interface TelegramEnhancedShareProps {
  videoUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
  mediaUrl?: string;
  className?: string;
}

const TelegramEnhancedShare: React.FC<TelegramEnhancedShareProps> = ({
  videoUrl,
  videoTitle,
  videoDescription,
  mediaUrl,
  className
}) => {
  const { shareVideo, shareToStory, isAvailable: shareAvailable } = useTelegramShare();
  const { getCurrentLocation, isGettingLocation } = useTelegramLocation();
  const { openSettings } = useTelegramSettings();
  const { isTelegramWebApp, hapticFeedback, showPopup } = useTelegramWebApp();

  const handleShare = () => {
    if (!videoUrl || !videoTitle) return;
    
    hapticFeedback('impact');
    shareVideo(videoUrl, videoTitle, videoDescription);
  };

  const handleShareToStory = () => {
    if (!mediaUrl) return;
    
    hapticFeedback('impact');
    shareToStory(mediaUrl, `🎬 Новый трюк в TRICKS! ${videoTitle || ''}`);
  };

  const handleShareWithLocation = async () => {
    if (!videoUrl || !videoTitle) return;
    
    try {
      const location = await getCurrentLocation();
      if (location) {
        const locationText = `📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        const enhancedDescription = `${videoDescription || ''}\n\n${locationText}`;
        shareVideo(videoUrl, videoTitle, enhancedDescription);
      } else {
        handleShare();
      }
    } catch (error) {
      console.error('Ошибка получения местоположения:', error);
      handleShare();
    }
  };

  const handleAdvancedShare = () => {
    if (!isTelegramWebApp) return;
    
    hapticFeedback('impact');
    
    showPopup({
      title: '📤 Поделиться видео',
      message: 'Выберите способ поделиться:',
      buttons: [
        { type: 'default', text: '💬 В чат', id: 'chat' },
        { type: 'default', text: '📱 В сторис', id: 'story' },
        { type: 'default', text: '📍 С геолокацией', id: 'location' },
        { type: 'close', text: 'Отмена' }
      ]
    }, (buttonId) => {
      switch (buttonId) {
        case 'chat':
          handleShare();
          break;
        case 'story':
          handleShareToStory();
          break;
        case 'location':
          handleShareWithLocation();
          break;
      }
    });
  };

  if (!shareAvailable && !isTelegramWebApp) {
    return null;
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <Button
        onClick={handleShare}
        variant="outline"
        size="sm"
        className="telegram-native-button"
        disabled={!videoUrl || !videoTitle}
      >
        <Share2 className="w-4 h-4 mr-1" />
        Поделиться
      </Button>

      {isTelegramWebApp && (
        <>
          {mediaUrl && (
            <Button
              onClick={handleShareToStory}
              variant="outline"
              size="sm"
              className="telegram-native-button"
            >
              <Camera className="w-4 h-4 mr-1" />
              Сторис
            </Button>
          )}

          <Button
            onClick={handleShareWithLocation}
            variant="outline"
            size="sm"
            className="telegram-native-button"
            disabled={isGettingLocation}
          >
            <MapPin className="w-4 h-4 mr-1" />
            {isGettingLocation ? '...' : 'С местом'}
          </Button>

          <Button
            onClick={handleAdvancedShare}
            variant="outline"
            size="sm"
            className="telegram-native-button"
          >
            <Settings className="w-4 h-4 mr-1" />
            Ещё
          </Button>
        </>
      )}
    </div>
  );
};

export default TelegramEnhancedShare;
