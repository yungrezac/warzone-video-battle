import { useEffect, useState, useCallback } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface TelegramWebAppData {
  query_id?: string;
  user?: TelegramUser;
  receiver?: TelegramUser;
  chat?: {
    id: number;
    type: string;
    title: string;
    username?: string;
    photo_url?: string;
  };
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
  can_send_after?: number;
  auth_date: number;
  hash: string;
}

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [initData, setInitData] = useState<TelegramWebAppData | null>(null);

  useEffect(() => {
    console.log('🔧 Инициализируем Telegram WebApp...');
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      console.log('✅ Telegram WebApp найден:', {
        version: tg.version,
        platform: tg.platform,
        user: tg.initDataUnsafe?.user?.first_name || 'none',
        viewportHeight: tg.viewportHeight,
        isExpanded: tg.isExpanded,
        colorScheme: tg.colorScheme
      });

      // Инициализируем WebApp
      tg.ready();
      
      // Расширяем приложение на весь экран
      if (tg.expand) {
        tg.expand();
      }

      // Включаем подтверждение закрытия
      tg.enableClosingConfirmation();

      // Настраиваем тему в соответствии с цветовой схемой Telegram
      const isDark = tg.colorScheme === 'dark';
      tg.setHeaderColor(isDark ? '#1a1a1a' : '#1e40af');
      tg.setBackgroundColor(isDark ? '#1a1a1a' : '#ffffff');

      // Устанавливаем цвета темы
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || (isDark ? '#1a1a1a' : '#ffffff'));
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || (isDark ? '#ffffff' : '#000000'));
      document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || (isDark ? '#707579' : '#999999'));
      document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#1e40af');
      document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#1e40af');
      document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');

      setWebApp(tg);
      setInitData(tg.initDataUnsafe);
      
      // Устанавливаем пользователя если есть
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
      
      setIsReady(true);
      
      // Отслеживаем изменения viewport
      tg.onEvent('viewportChanged', () => {
        console.log('📱 Viewport изменен:', {
          height: tg.viewportHeight,
          stableHeight: tg.viewportStableHeight,
          isExpanded: tg.isExpanded
        });
      });

      // Отслеживаем изменения темы
      tg.onEvent('themeChanged', () => {
        console.log('🎨 Тема изменена:', tg.colorScheme);
        const isDark = tg.colorScheme === 'dark';
        tg.setHeaderColor(isDark ? '#1a1a1a' : '#1e40af');
        tg.setBackgroundColor(isDark ? '#1a1a1a' : '#ffffff');
      });

      console.log('🎯 Telegram WebApp успешно инициализирован');
    } else {
      console.log('⚠️ Telegram WebApp не найден, работаем в обычном браузере');
      setIsReady(true);
    }
  }, []);

  const showMainButton = useCallback((text: string, onClick: () => void) => {
    if (webApp?.MainButton) {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    }
  }, [webApp]);

  const hideMainButton = useCallback(() => {
    if (webApp?.MainButton) {
      webApp.MainButton.hide();
    }
  }, [webApp]);

  const showBackButton = useCallback((onClick: () => void) => {
    if (webApp?.BackButton) {
      webApp.BackButton.onClick(onClick);
      webApp.BackButton.show();
    }
  }, [webApp]);

  const hideBackButton = useCallback(() => {
    if (webApp?.BackButton) {
      webApp.BackButton.hide();
    }
  }, [webApp]);

  const showAlert = useCallback((message: string) => {
    if (webApp?.showAlert) {
      webApp.showAlert(message);
    } else {
      alert(message);
    }
  }, [webApp]);

  const showConfirm = useCallback((message: string, callback?: (confirmed: boolean) => void) => {
    if (webApp?.showConfirm) {
      webApp.showConfirm(message, callback);
    } else {
      const result = confirm(message);
      callback?.(result);
    }
  }, [webApp]);

  const showPopup = useCallback((params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
    }>;
  }, callback?: (buttonId: string) => void) => {
    if (webApp?.showPopup) {
      webApp.showPopup(params, callback);
    } else {
      const result = confirm(params.message);
      callback?.(result ? 'ok' : 'cancel');
    }
  }, [webApp]);

  const hapticFeedback = useCallback((type: 'impact' | 'notification' | 'selection' = 'impact') => {
    if (webApp?.HapticFeedback) {
      if (type === 'impact') {
        webApp.HapticFeedback.impactOccurred('medium');
      } else if (type === 'notification') {
        webApp.HapticFeedback.notificationOccurred('success');
      } else if (type === 'selection') {
        webApp.HapticFeedback.selectionChanged();
      }
    }
  }, [webApp]);

  const openInvoice = useCallback((url: string, callback?: (status: string) => void) => {
    if (webApp?.openInvoice) {
      webApp.openInvoice(url, callback);
    } else {
      // Fallback для обычного браузера
      window.open(url, '_blank');
    }
  }, [webApp]);

  const openTelegramLink = useCallback((url: string) => {
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }, [webApp]);

  const openLink = useCallback((url: string, options?: { try_instant_view?: boolean }) => {
    if (webApp?.openLink) {
      webApp.openLink(url, options);
    } else {
      window.open(url, '_blank');
    }
  }, [webApp]);

  const sendData = useCallback((data: string) => {
    if (webApp?.sendData) {
      webApp.sendData(data);
    }
  }, [webApp]);

  const shareToStory = useCallback((mediaUrl: string, params?: {
    text?: string;
    widget_link?: {
      url: string;
      name?: string;
    };
  }) => {
    if (webApp?.shareToStory) {
      webApp.shareToStory(mediaUrl, params);
    }
  }, [webApp]);

  const requestWriteAccess = useCallback((callback?: (granted: boolean) => void) => {
    if (webApp?.requestWriteAccess) {
      webApp.requestWriteAccess(callback);
    } else {
      callback?.(false);
    }
  }, [webApp]);

  const requestContact = useCallback((callback?: (shared: boolean) => void) => {
    if (webApp?.requestContact) {
      webApp.requestContact(callback);
    } else {
      callback?.(false);
    }
  }, [webApp]);

  const close = useCallback(() => {
    if (webApp?.close) {
      webApp.close();
    }
  }, [webApp]);

  const showScanQrPopup = useCallback((params: {
    text?: string;
  }, callback?: (text: string) => void) => {
    if (webApp?.showScanQrPopup) {
      webApp.showScanQrPopup(params, callback);
    }
  }, [webApp]);

  const closeScanQrPopup = useCallback(() => {
    if (webApp?.closeScanQrPopup) {
      webApp.closeScanQrPopup();
    }
  }, [webApp]);

  const readTextFromClipboard = useCallback((callback?: (text: string) => void) => {
    if (webApp?.readTextFromClipboard) {
      webApp.readTextFromClipboard(callback);
    }
  }, [webApp]);

  const switchInlineQuery = useCallback((query: string, chooseChatTypes?: string[]) => {
    if (webApp?.switchInlineQuery) {
      webApp.switchInlineQuery(query, chooseChatTypes);
    }
  }, [webApp]);

  const setSettingsButton = useCallback((show: boolean, onClick?: () => void) => {
    if (webApp?.SettingsButton) {
      if (show) {
        if (onClick) {
          webApp.SettingsButton.onClick(onClick);
        }
        webApp.SettingsButton.show();
      } else {
        webApp.SettingsButton.hide();
      }
    }
  }, [webApp]);

  return {
    webApp,
    user,
    initData,
    isReady,
    isTelegramWebApp: !!webApp,
    colorScheme: webApp?.colorScheme || 'light',
    platform: webApp?.platform || 'unknown',
    version: webApp?.version || '0.0',
    viewportHeight: webApp?.viewportHeight || window.innerHeight,
    isExpanded: webApp?.isExpanded || false,
    
    // Actions
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    showAlert,
    showConfirm,
    showPopup,
    hapticFeedback,
    openInvoice,
    openTelegramLink,
    openLink,
    sendData,
    shareToStory,
    requestWriteAccess,
    requestContact,
    close,
    showScanQrPopup,
    closeScanQrPopup,
    readTextFromClipboard,
    switchInlineQuery,
    setSettingsButton,
  };
};
