
import { useCallback } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';

export const useTelegramCloudStorage = () => {
  const { webApp, isTelegramWebApp } = useTelegramWebApp();

  const setItem = useCallback((key: string, value: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (isTelegramWebApp && webApp?.CloudStorage) {
        webApp.CloudStorage.setItem(key, value, (error, success) => {
          if (error) {
            console.error('CloudStorage setItem error:', error);
            resolve(false);
          } else {
            resolve(success);
          }
        });
      } else {
        // Fallback to localStorage
        try {
          localStorage.setItem(`tg_${key}`, value);
          resolve(true);
        } catch (error) {
          console.error('localStorage setItem error:', error);
          resolve(false);
        }
      }
    });
  }, [webApp, isTelegramWebApp]);

  const getItem = useCallback((key: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (isTelegramWebApp && webApp?.CloudStorage) {
        webApp.CloudStorage.getItem(key, (error, value) => {
          if (error) {
            console.error('CloudStorage getItem error:', error);
            resolve(null);
          } else {
            resolve(value);
          }
        });
      } else {
        // Fallback to localStorage
        try {
          const value = localStorage.getItem(`tg_${key}`);
          resolve(value);
        } catch (error) {
          console.error('localStorage getItem error:', error);
          resolve(null);
        }
      }
    });
  }, [webApp, isTelegramWebApp]);

  const removeItem = useCallback((key: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (isTelegramWebApp && webApp?.CloudStorage) {
        webApp.CloudStorage.removeItem(key, (error, success) => {
          if (error) {
            console.error('CloudStorage removeItem error:', error);
            resolve(false);
          } else {
            resolve(success);
          }
        });
      } else {
        // Fallback to localStorage
        try {
          localStorage.removeItem(`tg_${key}`);
          resolve(true);
        } catch (error) {
          console.error('localStorage removeItem error:', error);
          resolve(false);
        }
      }
    });
  }, [webApp, isTelegramWebApp]);

  const getKeys = useCallback((): Promise<string[]> => {
    return new Promise((resolve) => {
      if (isTelegramWebApp && webApp?.CloudStorage) {
        webApp.CloudStorage.getKeys((error, keys) => {
          if (error) {
            console.error('CloudStorage getKeys error:', error);
            resolve([]);
          } else {
            resolve(keys);
          }
        });
      } else {
        // Fallback to localStorage
        try {
          const keys = Object.keys(localStorage)
            .filter(key => key.startsWith('tg_'))
            .map(key => key.slice(3));
          resolve(keys);
        } catch (error) {
          console.error('localStorage getKeys error:', error);
          resolve([]);
        }
      }
    });
  }, [webApp, isTelegramWebApp]);

  return {
    setItem,
    getItem,
    removeItem,
    getKeys,
    isAvailable: isTelegramWebApp && !!webApp?.CloudStorage,
  };
};
