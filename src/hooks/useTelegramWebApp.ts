
import { useEffect, useState } from 'react';

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  showPopup?: (params: any) => void;
  showAlert?: (message: string) => void;
  showConfirm?: (message: string, callback: (confirmed: boolean) => void) => void;
  showScanQrPopup?: (params: any) => void;
  closeScanQrPopup?: () => void;
  MainButton?: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isProgressVisible: boolean;
    isActive: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: any) => void;
  };
  BackButton?: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  initData: string;
  initDataUnsafe: any;
  version?: string;
  platform?: string;
  colorScheme?: 'light' | 'dark';
  themeParams?: any;
  isExpanded?: boolean;
  viewportHeight?: number;
  viewportStableHeight?: number;
  headerHeight?: number;
  onEvent?: (eventType: string, callback: () => void) => void;
  offEvent?: (eventType: string, callback: () => void) => void;
  sendData?: (data: string) => void;
  openLink?: (url: string) => void;
  openTelegramLink?: (url: string) => void;
  openInvoice?: (url: string, callback?: (status: string) => void) => void;
  sendInvoice?: (params: any, callback?: (status: string, data?: any) => void) => void;
}

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('🔄 useTelegramWebApp useEffect запускается...');
    
    const initializeWebApp = () => {
      try {
        // Проверяем доступность Telegram WebApp
        if (typeof window === 'undefined') {
          console.log('❌ Window недоступен');
          return;
        }

        console.log('🌐 Проверяем Telegram объект...');
        console.log('Telegram объект:', !!window.Telegram);
        console.log('WebApp объект:', !!window.Telegram?.WebApp);

        if (!window.Telegram?.WebApp) {
          console.log('❌ Telegram WebApp недоступен');
          // Устанавливаем готовность как true для веб-версии
          setIsReady(true);
          return;
        }

        const tg = window.Telegram.WebApp as any;
        console.log('✅ Telegram WebApp найден');
        
        // Инициализируем WebApp
        console.log('🚀 Инициализируем WebApp...');
        tg.ready();
        
        // Расширяем приложение
        if (typeof tg.expand === 'function') {
          tg.expand();
          console.log('📱 WebApp расширен');
        }
        
        // Настраиваем тему
        try {
          if (typeof tg.setHeaderColor === 'function') {
            tg.setHeaderColor('#1f2937');
          }
          if (typeof tg.setBackgroundColor === 'function') {
            tg.setBackgroundColor('#ffffff');
          }
          console.log('🎨 Тема настроена');
        } catch (themeError) {
          console.log('⚠️ Ошибка настройки темы (не критично):', themeError);
        }
        
        // Включаем подтверждение закрытия
        try {
          if (typeof tg.enableClosingConfirmation === 'function') {
            tg.enableClosingConfirmation();
          }
        } catch (confirmError) {
          console.log('⚠️ Ошибка настройки подтверждения (не критично):', confirmError);
        }
        
        setWebApp(tg as TelegramWebApp);
        setIsReady(true);
        
        console.log('✅ Telegram WebApp успешно инициализирован:', {
          version: tg.version || 'unknown',
          platform: tg.platform || 'unknown',
          colorScheme: tg.colorScheme || 'light',
          isExpanded: tg.isExpanded || false,
          viewportHeight: tg.viewportHeight || 0,
          hasUser: !!tg.initDataUnsafe?.user,
          userId: tg.initDataUnsafe?.user?.id || 'none'
        });
        
      } catch (error) {
        console.error('❌ Ошибка инициализации Telegram WebApp:', error);
        // Все равно устанавливаем готовность для работы веб-версии
        setIsReady(true);
      }
    };

    // Инициализируем сразу
    initializeWebApp();
    
    // Также попробуем через небольшую задержку на случай если скрипт еще загружается
    const timeoutId = setTimeout(() => {
      if (!isReady) {
        console.log('🔄 Повторная попытка инициализации через 500мс...');
        initializeWebApp();
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    webApp,
    isReady,
    user: webApp?.initDataUnsafe?.user,
    colorScheme: webApp?.colorScheme || 'light',
    themeParams: webApp?.themeParams,
    platform: webApp?.platform,
    version: webApp?.version
  };
};
