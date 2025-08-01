
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    console.log('🔧 Инициализируем расширенный Telegram WebApp...');
    
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
        setIsExpanded(tg.isExpanded);
        setViewportHeight(tg.viewportHeight);
      }

      // Включаем подтверждение закрытия
      tg.enableClosingConfirmation();

      // Настраиваем тему в соответствии с цветовой схемой Telegram
      const isDark = tg.colorScheme === 'dark';
      tg.setHeaderColor(isDark ? '#1a1a1a' : '#1e40af');
      tg.setBackgroundColor(isDark ? '#1a1a1a' : '#ffffff');

      // Устанавливаем CSS переменные для темы
      const root = document.documentElement;
      root.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || (isDark ? '#1a1a1a' : '#ffffff'));
      root.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || (isDark ? '#ffffff' : '#000000'));
      root.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || (isDark ? '#707579' : '#999999'));
      root.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#1e40af');
      root.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#1e40af');
      root.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || (isDark ? '#2a2a2a' : '#f0f0f0'));

      setWebApp(tg);
      setInitData(tg.initDataUnsafe);
      
      // Устанавливаем пользователя если есть
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
      
      setIsReady(true);
      
      // Отслеживаем изменения viewport
      const handleViewportChanged = () => {
        console.log('📱 Viewport изменен:', {
          height: tg.viewportHeight,
          stableHeight: tg.viewportStableHeight,
          isExpanded: tg.isExpanded
        });
        setViewportHeight(tg.viewportHeight);
        setIsExpanded(tg.isExpanded);
      };

      // Отслеживаем изменения темы
      const handleThemeChanged = () => {
        console.log('🎨 Тема изменена:', tg.colorScheme);
        const isDark = tg.colorScheme === 'dark';
        tg.setHeaderColor(isDark ? '#1a1a1a' : '#1e40af');
        tg.setBackgroundColor(isDark ? '#1a1a1a' : '#ffffff');
        
        // Обновляем CSS переменные
        const root = document.documentElement;
        root.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || (isDark ? '#1a1a1a' : '#ffffff'));
        root.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || (isDark ? '#ffffff' : '#000000'));
      };

      tg.onEvent('viewportChanged', handleViewportChanged);
      tg.onEvent('themeChanged', handleThemeChanged);

      console.log('🎯 Расширенный Telegram WebApp успешно инициализирован');
    } else {
      console.log('⚠️ Telegram WebApp не найден, работаем в обычном браузере');
      setIsReady(true);
    }
  }, []);

  // Main Button управление
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

  const setMainButtonLoading = useCallback((loading: boolean) => {
    if (webApp?.MainButton) {
      if (loading) {
        webApp.MainButton.showProgress();
      } else {
        webApp.MainButton.hideProgress();
      }
    }
  }, [webApp]);

  // Back Button управление
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

  // Settings Button управление
  const showSettingsButton = useCallback((onClick: () => void) => {
    if (webApp?.SettingsButton) {
      webApp.SettingsButton.onClick(onClick);
      webApp.SettingsButton.show();
    }
  }, [webApp]);

  const hideSettingsButton = useCallback(() => {
    if (webApp?.SettingsButton) {
      webApp.SettingsButton.hide();
    }
  }, [webApp]);

  // Popup и Alert методы
  const showAlert = useCallback((message: string, callback?: () => void) => {
    if (webApp?.showAlert) {
      webApp.showAlert(message, callback);
    } else {
      alert(message);
      callback?.();
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

  // Haptic Feedback
  const hapticFeedback = useCallback((type: 'impact' | 'notification' | 'selection' = 'impact', style?: 'light' | 'medium' | 'heavy') => {
    if (webApp?.HapticFeedback) {
      if (type === 'impact') {
        webApp.HapticFeedback.impactOccurred(style || 'medium');
      } else if (type === 'notification') {
        webApp.HapticFeedback.notificationOccurred('success');
      } else if (type === 'selection') {
        webApp.HapticFeedback.selectionChanged();
      }
    }
  }, [webApp]);

  // Cloud Storage методы
  const cloudStorageSetItem = useCallback((key: string, value: string, callback?: (error: string | null, success: boolean) => void) => {
    if (webApp?.CloudStorage) {
      webApp.CloudStorage.setItem(key, value, callback);
    } else {
      try {
        localStorage.setItem(`tg_cloud_${key}`, value);
        callback?.(null, true);
      } catch (error) {
        callback?.(error as string, false);
      }
    }
  }, [webApp]);

  const cloudStorageGetItem = useCallback((key: string, callback: (error: string | null, value: string | null) => void) => {
    if (webApp?.CloudStorage) {
      webApp.CloudStorage.getItem(key, callback);
    } else {
      try {
        const value = localStorage.getItem(`tg_cloud_${key}`);
        callback(null, value);
      } catch (error) {
        callback(error as string, null);
      }
    }
  }, [webApp]);

  const cloudStorageGetItems = useCallback((keys: string[], callback: (error: string | null, values: { [key: string]: string }) => void) => {
    if (webApp?.CloudStorage) {
      webApp.CloudStorage.getItems(keys, callback);
    } else {
      try {
        const values: { [key: string]: string } = {};
        keys.forEach(key => {
          const value = localStorage.getItem(`tg_cloud_${key}`);
          if (value !== null) {
            values[key] = value;
          }
        });
        callback(null, values);
      } catch (error) {
        callback(error as string, {});
      }
    }
  }, [webApp]);

  const cloudStorageRemoveItem = useCallback((key: string, callback?: (error: string | null, success: boolean) => void) => {
    if (webApp?.CloudStorage) {
      webApp.CloudStorage.removeItem(key, callback);
    } else {
      try {
        localStorage.removeItem(`tg_cloud_${key}`);
        callback?.(null, true);
      } catch (error) {
        callback?.(error as string, false);
      }
    }
  }, [webApp]);

  const cloudStorageGetKeys = useCallback((callback: (error: string | null, keys: string[]) => void) => {
    if (webApp?.CloudStorage) {
      webApp.CloudStorage.getKeys(callback);
    } else {
      try {
        const keys = Object.keys(localStorage)
          .filter(key => key.startsWith('tg_cloud_'))
          .map(key => key.replace('tg_cloud_', ''));
        callback(null, keys);
      } catch (error) {
        callback(error as string, []);
      }
    }
  }, [webApp]);

  // QR Code Scanner
  const showScanQrPopup = useCallback((text: string = 'Отсканируйте QR код', callback?: (text: string) => void) => {
    if (webApp?.showScanQrPopup) {
      webApp.showScanQrPopup({ text }, callback);
    } else {
      // Fallback для веб-версии
      const qrText = prompt(`${text}\nВведите текст QR кода:`);
      if (qrText && callback) {
        callback(qrText);
      }
    }
  }, [webApp]);

  const closeScanQrPopup = useCallback(() => {
    if (webApp?.closeScanQrPopup) {
      webApp.closeScanQrPopup();
    }
  }, [webApp]);

  // Clipboard
  const readTextFromClipboard = useCallback((callback?: (text: string) => void) => {
    if (webApp?.readTextFromClipboard) {
      webApp.readTextFromClipboard(callback);
    } else {
      // Fallback для веб-версии
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          callback?.(text);
        }).catch(() => {
          callback?.('');
        });
      } else {
        callback?.('');
      }
    }
  }, [webApp]);

  // Permissions
  const requestWriteAccess = useCallback((callback?: (granted: boolean) => void) => {
    if (webApp?.requestWriteAccess) {
      webApp.requestWriteAccess(callback);
    } else {
      // В веб-версии разрешения всегда предоставлены
      callback?.(true);
    }
  }, [webApp]);

  const requestContact = useCallback((callback?: (shared: boolean) => void) => {
    if (webApp?.requestContact) {
      webApp.requestContact(callback);
    } else {
      // В веб-версии недоступно
      callback?.(false);
    }
  }, [webApp]);

  // Links and Navigation
  const openLink = useCallback((url: string, options?: { try_instant_view?: boolean }) => {
    if (webApp?.openLink) {
      webApp.openLink(url, options);
    } else {
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

  const openInvoice = useCallback((url: string, callback?: (status: string) => void) => {
    if (webApp?.openInvoice) {
      webApp.openInvoice(url, callback);
    } else {
      window.open(url, '_blank');
      callback?.('unknown');
    }
  }, [webApp]);

  // Stories and Sharing
  const shareToStory = useCallback((mediaUrl: string, params?: {
    text?: string;
    widget_link?: {
      url: string;
      name?: string;
    };
  }) => {
    if (webApp?.shareToStory) {
      webApp.shareToStory(mediaUrl, params);
    } else {
      // Fallback - копировать ссылку
      if (navigator.share) {
        navigator.share({
          title: params?.text || 'TRICKS',
          url: mediaUrl,
        });
      }
    }
  }, [webApp]);

  // Data sending
  const sendData = useCallback((data: string) => {
    if (webApp?.sendData) {
      webApp.sendData(data);
    }
  }, [webApp]);

  const switchInlineQuery = useCallback((query: string, choose_chat_types?: string[]) => {
    if (webApp?.switchInlineQuery) {
      webApp.switchInlineQuery(query, choose_chat_types);
    }
  }, [webApp]);

  // App control
  const close = useCallback(() => {
    if (webApp?.close) {
      webApp.close();
    } else {
      window.close();
    }
  }, [webApp]);

  const expand = useCallback(() => {
    if (webApp?.expand) {
      webApp.expand();
      setIsExpanded(true);
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
    viewportHeight: viewportHeight || window.innerHeight,
    isExpanded: isExpanded,
    
    // Button Controls
    showMainButton,
    hideMainButton,
    setMainButtonLoading,
    showBackButton,
    hideBackButton,
    showSettingsButton,
    hideSettingsButton,
    
    // Popups and Alerts
    showAlert,
    showConfirm,
    showPopup,
    
    // Haptic Feedback
    hapticFeedback,
    
    // Cloud Storage
    cloudStorageSetItem,
    cloudStorageGetItem,
    cloudStorageGetItems,
    cloudStorageRemoveItem,
    cloudStorageGetKeys,
    
    // QR Scanner
    showScanQrPopup,
    closeScanQrPopup,
    
    // Clipboard
    readTextFromClipboard,
    
    // Permissions
    requestWriteAccess,
    requestContact,
    
    // Links
    openLink,
    openTelegramLink,
    openInvoice,
    
    // Sharing
    shareToStory,
    
    // Data
    sendData,
    switchInlineQuery,
    
    // App Control
    close,
    expand,
  };
};
