
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Clipboard, Check } from 'lucide-react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { toast } from 'sonner';

interface TelegramClipboardProps {
  onRead?: (text: string) => void;
  text?: string;
  children?: React.ReactNode;
}

const TelegramClipboard: React.FC<TelegramClipboardProps> = ({ 
  onRead, 
  text,
  children 
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const { readTextFromClipboard, isTelegramWebApp, hapticFeedback } = useTelegramWebApp();

  const handleReadClipboard = () => {
    hapticFeedback('impact');
    
    readTextFromClipboard((clipboardText: string) => {
      if (clipboardText) {
        onRead?.(clipboardText);
        toast.success('Текст получен из буфера обмена');
        hapticFeedback('notification');
      } else {
        toast.info('Буфер обмена пуст');
      }
    });
  };

  const handleCopyToClipboard = async (textToCopy: string) => {
    try {
      hapticFeedback('impact');
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast.success('Скопировано в буфер обмена');
      hapticFeedback('notification');
    } catch (error) {
      console.error('Ошибка копирования:', error);
      toast.error('Не удалось скопировать');
    }
  };

  if (children) {
    return (
      <div className="flex gap-2 items-center">
        {children}
        {text && (
          <Button
            onClick={() => handleCopyToClipboard(text)}
            variant="ghost"
            size="sm"
            className="gap-1"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-500">Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Копировать
              </>
            )}
          </Button>
        )}
        {onRead && (
          <Button
            onClick={handleReadClipboard}
            variant="ghost"
            size="sm"
            className="gap-1"
            disabled={!isTelegramWebApp}
          >
            <Clipboard className="w-4 h-4" />
            Вставить
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {text && (
        <Button
          onClick={() => handleCopyToClipboard(text)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              Скопировано
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Копировать
            </>
          )}
        </Button>
      )}
      
      {onRead && (
        <Button
          onClick={handleReadClipboard}
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!isTelegramWebApp}
          title={!isTelegramWebApp ? 'Доступно только в Telegram Mini App' : undefined}
        >
          <Clipboard className="w-4 h-4" />
          Из буфера
        </Button>
      )}
    </div>
  );
};

export default TelegramClipboard;
