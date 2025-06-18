
import React from 'react';
import { Share2, Download } from 'lucide-react';
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
  const { shareVideo, savePreparedInlineMessage, downloadFile, hapticFeedback, isTelegramWebApp } = useTelegramWebApp();
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

    // Используем shareVideo для немедленной отправки
    shareVideo(videoUrl, thumbnailUrl, message);
    
    // Также сохраняем подготовленное сообщение для возможности повторного использования
    if (isTelegramWebApp) {
      savePreparedInlineMessage(videoUrl, thumbnailUrl, message);
    }
    
    toast.success('Видео отправлено для шаринга');
  };

  const handleDownload = () => {
    console.log('📥 Обработка скачивания видео:', { videoUrl, authorName });

    hapticFeedback('selection');

    const fileName = `tricks_${authorName}_${Date.now()}.mp4`;
    downloadFile(videoUrl, fileName);
    
    toast.success('Скачивание видео начато');
  };

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="text-gray-600 hover:text-blue-500 h-7 px-1.5"
        title="Поделиться видео"
      >
        <Share2 className="w-3.5 h-3.5" />
      </Button>
      
      {isTelegramWebApp && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="text-gray-600 hover:text-green-500 h-7 px-1.5"
          title="Скачать видео"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};

export default VideoShareButton;
