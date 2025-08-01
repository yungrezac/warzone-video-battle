
import { useCallback } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';

export interface CloudStorageData {
  [key: string]: string;
}

export const useTelegramCloudStorage = () => {
  const { 
    cloudStorageSetItem, 
    cloudStorageGetItem, 
    cloudStorageGetItems, 
    cloudStorageRemoveItem, 
    cloudStorageGetKeys,
    isTelegramWebApp 
  } = useTelegramWebApp();

  const setItem = useCallback((key: string, value: any): Promise<boolean> => {
    return new Promise((resolve) => {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      cloudStorageSetItem(key, serializedValue, (error, success) => {
        if (error) {
          console.error('Cloud Storage setItem error:', error);
          resolve(false);
        } else {
          resolve(success);
        }
      });
    });
  }, [cloudStorageSetItem]);

  const getItem = useCallback(<T = string>(key: string, defaultValue?: T): Promise<T | null> => {
    return new Promise((resolve) => {
      cloudStorageGetItem(key, (error, value) => {
        if (error || value === null) {
          resolve(defaultValue || null);
        } else {
          try {
            // Пытаемся распарсить JSON
            const parsedValue = JSON.parse(value);
            resolve(parsedValue);
          } catch {
            // Если не получилось, возвращаем как строку
            resolve(value as T);
          }
        }
      });
    });
  }, [cloudStorageGetItem]);

  const getItems = useCallback((keys: string[]): Promise<CloudStorageData> => {
    return new Promise((resolve) => {
      cloudStorageGetItems(keys, (error, values) => {
        if (error) {
          console.error('Cloud Storage getItems error:', error);
          resolve({});
        } else {
          resolve(values);
        }
      });
    });
  }, [cloudStorageGetItems]);

  const removeItem = useCallback((key: string): Promise<boolean> => {
    return new Promise((resolve) => {
      cloudStorageRemoveItem(key, (error, success) => {
        if (error) {
          console.error('Cloud Storage removeItem error:', error);
          resolve(false);
        } else {
          resolve(success);
        }
      });
    });
  }, [cloudStorageRemoveItem]);

  const getKeys = useCallback((): Promise<string[]> => {
    return new Promise((resolve) => {
      cloudStorageGetKeys((error, keys) => {
        if (error) {
          console.error('Cloud Storage getKeys error:', error);
          resolve([]);
        } else {
          resolve(keys);
        }
      });
    });
  }, [cloudStorageGetKeys]);

  const clear = useCallback(async (): Promise<boolean> => {
    try {
      const keys = await getKeys();
      const removePromises = keys.map(key => removeItem(key));
      const results = await Promise.all(removePromises);
      return results.every(result => result);
    } catch (error) {
      console.error('Cloud Storage clear error:', error);
      return false;
    }
  }, [getKeys, removeItem]);

  // Специальные методы для работы с пользовательскими настройками
  const saveUserSettings = useCallback(async (settings: Record<string, any>): Promise<boolean> => {
    return await setItem('user_settings', settings);
  }, [setItem]);

  const getUserSettings = useCallback(async <T = Record<string, any>>(defaultSettings?: T): Promise<T | null> => {
    return await getItem<T>('user_settings', defaultSettings);
  }, [getItem]);

  const saveGameProgress = useCallback(async (progress: Record<string, any>): Promise<boolean> => {
    return await setItem('game_progress', progress);
  }, [setItem]);

  const getGameProgress = useCallback(async <T = Record<string, any>>(defaultProgress?: T): Promise<T | null> => {
    return await getItem<T>('game_progress', defaultProgress);
  }, [getItem]);

  return {
    isAvailable: isTelegramWebApp,
    setItem,
    getItem,
    getItems,
    removeItem,
    getKeys,
    clear,
    saveUserSettings,
    getUserSettings,
    saveGameProgress,
    getGameProgress,
  };
};
