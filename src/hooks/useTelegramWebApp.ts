
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
}

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Инициализируем WebApp
      tg.ready();
      tg.expand();
      
      // Настраиваем тему (если методы доступны)
      if (tg.setHeaderColor) {
        tg.setHeaderColor('#1f2937');
      }
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor('#ffffff');
      }
      
      // Включаем подтверждение закрытия (если метод доступен)
      if (tg.enableClosingConfirmation) {
        tg.enableClosingConfirmation();
      }
      
      setWebApp(tg);
      setIsReady(true);
      
      console.log('🚀 Telegram WebApp инициализирован:', {
        version: tg.version || 'unknown',
        platform: tg.platform || 'unknown',
        colorScheme: tg.colorScheme || 'light',
        isExpanded: tg.isExpanded || false,
        viewportHeight: tg.viewportHeight || 0
      });
    }
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
