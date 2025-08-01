
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clipboard, Check } from 'lucide-react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

interface TelegramClipboardProps {
  onTextRead?: (text: string) => void;
  className?: string;
}

const TelegramClipboard: React.FC<TelegramClipboardProps> = ({
  onTextRead,
  className
}) => {
  const { webApp, isTelegramWebApp, hapticFeedback } = useTelegramWebApp();
  const [isReading, setIsReading] = useState(false);
  const [lastRead, setLastRead] = useState<string | null>(null);

  const readFromClipboard = async () => {
    if (!isTelegramWebApp || !webApp?.readTextFromClipboard) {
      // Fallback для браузера
      try {
        const text = await navigator.clipboard.readText();
        handleTextRead(text);
      } catch (error) {
        console.error('Clipboard API недоступен:', error);
      }
      return;
    }

    setIsReading(true);
    hapticFeedback('impact');

    webApp.readTextFromClipboard((text: string) => {
      setIsReading(false);
      handleTextRead(text);
    });
  };

  const handleTextRead = (text: string) => {
    if (text) {
      console.log('Текст из буфера обмена:', text);
      setLastRead(text);
      hapticFeedback('notification');
      onTextRead?.(text);
    } else {
      console.log('Буфер обмена пуст или доступ запрещен');
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={readFromClipboard}
        disabled={isReading}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {lastRead ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Clipboard className="w-4 h-4" />
        )}
        {isReading ? 'Читаем...' : 'Из буфера'}
      </Button>
      
      {lastRead && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 max-w-xs truncate">
          {lastRead}
        </div>
      )}
    </div>
  );
};

export default TelegramClipboard;
