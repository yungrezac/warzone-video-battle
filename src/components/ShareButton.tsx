
import React, { useState } from 'react';
import { Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { captureElementAsImage, shareToTelegram, generateShareText } from '@/utils/shareUtils';
import { useAuth } from '@/components/AuthWrapper';

interface ShareButtonProps {
  videoId: string;
  videoOwnerName: string;
  videoOwnerId: string;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ 
  videoId, 
  videoOwnerName, 
  videoOwnerId,
  className = "" 
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const { user } = useAuth();

  const handleShare = async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    
    try {
      // Находим элемент видео карточки
      const videoElement = document.querySelector(`[data-video-id="${videoId}"]`) as HTMLElement;
      
      if (!videoElement) {
        console.error('Не удалось найти элемент видео для скриншота');
        alert('Ошибка при создании скриншота');
        return;
      }

      // Создаем скриншот
      console.log('Создаем скриншот видео...');
      const imageBlob = await captureElementAsImage(videoElement);
      
      // Определяем, это видео пользователя или чужое
      const isOwnVideo = user?.id === videoOwnerId;
      
      // Генерируем текст для отправки
      const shareText = generateShareText(isOwnVideo, videoOwnerName);
      
      console.log('Отправляем в Telegram:', { isOwnVideo, shareText });
      
      // Отправляем в Telegram
      const success = await shareToTelegram(imageBlob, shareText);
      
      if (success) {
        console.log('Успешно поделились!');
      } else {
        console.log('Ошибка при отправке');
      }
      
    } catch (error) {
      console.error('Ошибка при создании скриншота или отправке:', error);
      alert('Произошла ошибка при попытке поделиться');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleShare}
      disabled={isSharing}
      className={`text-gray-600 hover:text-blue-500 h-7 px-1.5 ${className}`}
    >
      <Share className="w-3.5 h-3.5 mr-1" />
      <span className="text-xs">
        {isSharing ? 'Отправка...' : 'Поделиться'}
      </span>
    </Button>
  );
};

export default ShareButton;
