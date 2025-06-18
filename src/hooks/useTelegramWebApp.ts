
import { useEffect, useState, useCallback } from 'react';

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

      // Настраиваем обработчики событий для новых возможностей
      const handleShareMessageSent = (data: any) => {
        console.log('📤 Сообщение успешно отправлено:', data);
      };

      const handleShareMessageFailed = (error: any) => {
        console.error('❌ Ошибка отправки сообщения:', error);
      };

      const handleFileDownloadRequested = (data: any) => {
        console.log('📥 Запрос на скачивание файла:', data);
      };

      // Подписываемся на события
      tg.onEvent('shareMessageSent', handleShareMessageSent);
      tg.onEvent('shareMessageFailed', handleShareMessageFailed);
      tg.onEvent('fileDownloadRequested', handleFileDownloadRequested);

      setWebApp(tg);
      
      // Устанавливаем пользователя если есть
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
      
      setIsReady(true);
      
      console.log('🎯 Telegram WebApp успешно инициализирован');

      // Очистка при размонтировании
      return () => {
        tg.offEvent('shareMessageSent', handleShareMessageSent);
        tg.offEvent('shareMessageFailed', handleShareMessageFailed);
        tg.offEvent('fileDownloadRequested', handleFileDownloadRequested);
      };
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

  const shareVideo = useCallback((videoUrl: string, thumbnailUrl: string, message: string) => {
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
  }, [webApp, hapticFeedback]);

  const savePreparedInlineMessage = useCallback((videoUrl: string, thumbnailUrl: string, message: string) => {
    console.log('📤 Сохранение подготовленного сообщения:', { videoUrl, message });
    
    if (webApp?.savePreparedInlineMessage) {
      webApp.savePreparedInlineMessage({
        text: message,
        media: {
          type: 'video',
          url: videoUrl,
          thumbnail_url: thumbnailUrl
        }
      }, (preparedMessage: any) => {
        console.log('✅ Подготовленное сообщение сохранено:', preparedMessage);
      });
    } else {
      console.log('⚠️ savePreparedInlineMessage недоступен');
    }
  }, [webApp]);

  const downloadFile = useCallback((fileUrl: string, fileName: string) => {
    console.log('📥 Попытка скачать файл:', { fileUrl, fileName });
    
    if (webApp?.downloadFile) {
      webApp.downloadFile({
        url: fileUrl,
        file_name: fileName
      }, (success: boolean) => {
        console.log('📥 Результат скачивания файла:', success);
        if (success) {
          hapticFeedback('notification');
        }
      });
    } else {
      console.log('⚠️ downloadFile недоступен, используем fallback');
      // Fallback для обычного браузера
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [webApp, hapticFeedback]);

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
    savePreparedInlineMessage,
    downloadFile,
  };
};
