
import { useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('🔧 Инициализируем Telegram WebApp...');
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      console.log('✅ Telegram WebApp найден:', {
        version: tg.version,
        platform: tg.platform,
        user: tg.initDataUnsafe?.user?.first_name || 'none'
      });

      // Инициализируем WebApp
      tg.ready();
      
      // Расширяем приложение на весь экран
      if (tg.expand) {
        tg.expand();
      }

      // Настраиваем тему - используем свойства
      tg.headerColor = '#1e40af';
      tg.backgroundColor = '#ffffff';

      setWebApp(tg);
      
      // Устанавливаем пользователя если есть
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
      
      setIsReady(true);
      
      console.log('🎯 Telegram WebApp успешно инициализирован');
    } else {
      console.log('⚠️ Telegram WebApp не найден, работаем в обычном браузере');
      setIsReady(true);
    }
  }, []);

  const showMainButton = (text: string, onClick: () => void) => {
    if (webApp?.MainButton) {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    }
  };

  const hideMainButton = () => {
    if (webApp?.MainButton) {
      webApp.MainButton.hide();
    }
  };

  const showAlert = (message: string) => {
    if (webApp?.showAlert) {
      webApp.showAlert(message);
    } else {
      alert(message);
    }
  };

  const hapticFeedback = (type: 'impact' | 'notification' | 'selection' = 'impact') => {
    if (webApp?.HapticFeedback) {
      if (type === 'impact') {
        webApp.HapticFeedback.impactOccurred('medium');
      } else if (type === 'notification') {
        webApp.HapticFeedback.notificationOccurred('success');
      } else if (type === 'selection') {
        webApp.HapticFeedback.selectionChanged();
      }
    }
  };

  const openInvoice = (url: string, callback?: (status: string) => void) => {
    if (webApp?.openInvoice) {
      webApp.openInvoice(url, callback);
    } else {
      // Fallback для обычного браузера
      window.open(url, '_blank');
    }
  };

  const shareVideo = (videoUrl: string, thumbnailUrl: string, message: string) => {
    console.log('📤 Попытка поделиться видео:', { videoUrl, message });
    
    if (webApp?.shareMessage) {
      webApp.shareMessage({
        text: message,
        media: {
          type: 'video',
          url: videoUrl,
          thumbnail_url: thumbnailUrl
        }
      }, (success: boolean) => {
        console.log('📤 Результат шаринга видео:', success);
        if (success) {
          hapticFeedback('notification');
        }
      });
    } else {
      console.log('⚠️ shareMessage недоступен, используем fallback');
      // Fallback для обычного браузера
      if (navigator.share) {
        navigator.share({
          title: 'TRICKS - видео трюков',
          text: message,
          url: 'https://t.me/Tricksrubot/aps'
        }).catch(err => console.log('Ошибка Web Share API:', err));
      } else {
        // Копируем в буфер обмена
        navigator.clipboard.writeText(`${message}`).then(() => {
          alert('Сообщение скопировано в буфер обмена!');
        }).catch(() => {
          alert('Не удалось скопировать сообщение');
        });
      }
    }
  };

  return {
    webApp,
    user,
    isReady,
    isTelegramWebApp: !!webApp,
    colorScheme: webApp?.colorScheme || 'light',
    showMainButton,
    hideMainButton,
    showAlert,
    hapticFeedback,
    openInvoice,
    shareVideo,
  };
};
