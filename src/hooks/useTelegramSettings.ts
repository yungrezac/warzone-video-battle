
import { useCallback, useEffect, useState } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';

interface TelegramSettings {
  notifications: boolean;
  hapticFeedback: boolean;
  autoPlay: boolean;
  dataUsage: 'wifi' | 'mobile' | 'always';
}

export const useTelegramSettings = () => {
  const { webApp, isTelegramWebApp, hapticFeedback, setSettingsButton } = useTelegramWebApp();
  const [settings, setSettings] = useState<TelegramSettings>({
    notifications: true,
    hapticFeedback: true,
    autoPlay: true,
    dataUsage: 'wifi',
  });

  const openSettings = useCallback(() => {
    if (!isTelegramWebApp || !webApp) return;

    hapticFeedback('impact');
    
    webApp.showPopup({
      title: '⚙️ Настройки TRICKS',
      message: 'Здесь будут настройки приложения',
      buttons: [
        { type: 'default', text: 'Уведомления' },
        { type: 'default', text: 'Качество видео' },
        { type: 'close', text: 'Закрыть' }
      ]
    }, (buttonId) => {
      console.log('Settings button clicked:', buttonId);
      hapticFeedback('selection');
    });
  }, [webApp, isTelegramWebApp, hapticFeedback]);

  const requestPermissions = useCallback(async () => {
    if (!isTelegramWebApp || !webApp) return false;

    return new Promise<boolean>((resolve) => {
      hapticFeedback('impact');
      
      webApp.requestWriteAccess((granted) => {
        if (granted) {
          hapticFeedback('notification');
          console.log('✅ Доступ к записи получен');
        } else {
          console.log('❌ Доступ к записи отклонен');
        }
        resolve(granted);
      });
    });
  }, [webApp, isTelegramWebApp, hapticFeedback]);

  const requestContact = useCallback(async () => {
    if (!isTelegramWebApp || !webApp) return false;

    return new Promise<boolean>((resolve) => {
      hapticFeedback('impact');
      
      webApp.requestContact((shared) => {
        if (shared) {
          hapticFeedback('notification');
          console.log('✅ Контакт предоставлен');
        } else {
          console.log('❌ Контакт не предоставлен');
        }
        resolve(shared);
      });
    });
  }, [webApp, isTelegramWebApp, hapticFeedback]);

  useEffect(() => {
    if (isTelegramWebApp && webApp) {
      // Показываем кнопку настроек
      setSettingsButton(true, openSettings);

      return () => {
        setSettingsButton(false);
      };
    }
  }, [isTelegramWebApp, webApp, setSettingsButton, openSettings]);

  const updateSetting = useCallback(<K extends keyof TelegramSettings>(
    key: K, 
    value: TelegramSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    hapticFeedback('selection');
  }, [hapticFeedback]);

  return {
    settings,
    updateSetting,
    openSettings,
    requestPermissions,
    requestContact,
    isAvailable: isTelegramWebApp && !!webApp,
  };
};
