
import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';

interface VideoShareButtonProps {
  videoUrl: string;
  thumbnailUrl: string;
  authorName: string;
  videoOwnerId: string;
}

const VideoShareButton: React.FC<VideoShareButtonProps> = ({
  videoUrl,
  thumbnailUrl,
  authorName,
  videoOwnerId
}) => {
  const { shareVideo, hapticFeedback } = useTelegramWebApp();
  const { user } = useAuth();

  const handleShare = () => {
    console.log('🎯 Обработка шаринга видео:', { 
      videoOwnerId, 
      currentUserId: user?.id,
      authorName 
    });

    hapticFeedback('selection');

    let message: string;
    
    // Проверяем, является ли текущий пользователь автором видео
    if (user?.id === videoOwnerId) {
      message = "Посмотри мое видео в приложении TRICKS https://t.me/Tricksrubot/aps";
    } else {
      message = `Посмотри удивительное видео ${authorName} https://t.me/Tricksrubot/aps`;
    }

    console.log('📝 Сообщение для шаринга:', message);

    shareVideo(videoUrl, thumbnailUrl, message);
    toast.success('Видео отправлено для шаринга');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleShare}
      className="text-gray-600 hover:text-blue-500 h-7 px-1.5"
      title="Поделиться видео"
    >
      <Share2 className="w-3.5 h-3.5" />
    </Button>
  );
};

export default VideoShareButton;
