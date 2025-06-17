
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
        user: tg.initDataUnsafe?.user?.first_name || 'none',
        hasDeviceStorage: !!tg.DeviceStorage,
        hasSecureStorage: !!tg.SecureStorage
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
      
      // Проверяем новые возможности хранения
      if (tg.DeviceStorage) {
        console.log('💾 DeviceStorage доступен - включена поддержка постоянного локального хранения');
      }
      
      if (tg.SecureStorage) {
        console.log('🔐 SecureStorage доступен - включена поддержка безопасного хранения');
      }
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

  return {
    webApp,
    user,
    isReady,
    isTelegramWebApp: !!webApp,
    colorScheme: webApp?.colorScheme || 'light',
    hasDeviceStorage: !!webApp?.DeviceStorage,
    hasSecureStorage: !!webApp?.SecureStorage,
    showMainButton,
    hideMainButton,
    showAlert,
    hapticFeedback,
    openInvoice,
  };
};
