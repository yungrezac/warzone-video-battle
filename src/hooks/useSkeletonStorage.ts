
import { useState, useEffect, useCallback } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';

interface SkeletonData {
  id: string;
  type: 'video' | 'profile' | 'market' | 'tournament';
  timestamp: number;
  data: any;
}

export const useSkeletonStorage = () => {
  const { webApp } = useTelegramWebApp();
  const [isStorageAvailable, setIsStorageAvailable] = useState(false);

  useEffect(() => {
    // Проверяем доступность DeviceStorage
    if (webApp?.DeviceStorage) {
      setIsStorageAvailable(true);
      console.log('✅ DeviceStorage доступен');
    } else {
      console.log('⚠️ DeviceStorage недоступен, используем fallback');
    }
  }, [webApp]);

  const saveSkeletonData = useCallback((key: string, data: SkeletonData) => {
    return new Promise<boolean>((resolve) => {
      const serializedData = JSON.stringify(data);
      
      if (webApp?.DeviceStorage) {
        console.log('💾 Сохраняем скелетон в DeviceStorage:', key);
        webApp.DeviceStorage.setItem(key, serializedData, (error, success) => {
          if (error) {
            console.error('❌ Ошибка сохранения в DeviceStorage:', error);
            // Fallback к localStorage
            try {
              localStorage.setItem(`skeleton_${key}`, serializedData);
              resolve(true);
            } catch (e) {
              console.error('❌ Ошибка fallback localStorage:', e);
              resolve(false);
            }
          } else {
            console.log('✅ Скелетон сохранен в DeviceStorage');
            resolve(success);
          }
        });
      } else {
        // Fallback к localStorage
        try {
          localStorage.setItem(`skeleton_${key}`, serializedData);
          console.log('💾 Скелетон сохранен в localStorage (fallback)');
          resolve(true);
        } catch (error) {
          console.error('❌ Ошибка localStorage fallback:', error);
          resolve(false);
        }
      }
    });
  }, [webApp]);

  const loadSkeletonData = useCallback((key: string): Promise<SkeletonData | null> => {
    return new Promise((resolve) => {
      if (webApp?.DeviceStorage) {
        console.log('📖 Загружаем скелетон из DeviceStorage:', key);
        webApp.DeviceStorage.getItem(key, (error, value) => {
          if (error || !value) {
            console.log('⚠️ Скелетон не найден в DeviceStorage, пробуем localStorage');
            // Fallback к localStorage
            try {
              const fallbackValue = localStorage.getItem(`skeleton_${key}`);
              if (fallbackValue) {
                const parsed = JSON.parse(fallbackValue);
                console.log('✅ Скелетон загружен из localStorage (fallback)');
                resolve(parsed);
              } else {
                resolve(null);
              }
            } catch (e) {
              console.error('❌ Ошибка парсинга fallback данных:', e);
              resolve(null);
            }
          } else {
            try {
              const parsed = JSON.parse(value);
              console.log('✅ Скелетон загружен из DeviceStorage');
              resolve(parsed);
            } catch (e) {
              console.error('❌ Ошибка парсинга DeviceStorage данных:', e);
              resolve(null);
            }
          }
        });
      } else {
        // Fallback к localStorage
        try {
          const value = localStorage.getItem(`skeleton_${key}`);
          if (value) {
            const parsed = JSON.parse(value);
            console.log('📖 Скелетон загружен из localStorage (fallback)');
            resolve(parsed);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('❌ Ошибка localStorage fallback при загрузке:', error);
          resolve(null);
        }
      }
    });
  }, [webApp]);

  const saveSecureData = useCallback((key: string, data: any) => {
    return new Promise<boolean>((resolve) => {
      const serializedData = JSON.stringify(data);
      
      if (webApp?.SecureStorage) {
        console.log('🔐 Сохраняем секретные данные в SecureStorage:', key);
        webApp.SecureStorage.setItem(key, serializedData, (error, success) => {
          if (error) {
            console.error('❌ Ошибка сохранения в SecureStorage:', error);
            resolve(false);
          } else {
            console.log('✅ Секретные данные сохранены в SecureStorage');
            resolve(success);
          }
        });
      } else {
        console.log('⚠️ SecureStorage недоступен');
        resolve(false);
      }
    });
  }, [webApp]);

  const loadSecureData = useCallback((key: string): Promise<any | null> => {
    return new Promise((resolve) => {
      if (webApp?.SecureStorage) {
        console.log('🔐 Загружаем секретные данные из SecureStorage:', key);
        webApp.SecureStorage.getItem(key, (error, value) => {
          if (error || !value) {
            console.log('⚠️ Секретные данные не найдены в SecureStorage');
            resolve(null);
          } else {
            try {
              const parsed = JSON.parse(value);
              console.log('✅ Секретные данные загружены из SecureStorage');
              resolve(parsed);
            } catch (e) {
              console.error('❌ Ошибка парсинга SecureStorage данных:', e);
              resolve(null);
            }
          }
        });
      } else {
        console.log('⚠️ SecureStorage недоступен');
        resolve(null);
      }
    });
  }, [webApp]);

  const clearOldSkeletons = useCallback(() => {
    const maxAge = 24 * 60 * 60 * 1000; // 24 часа
    const now = Date.now();

    // Очищаем только localStorage, так как DeviceStorage не поддерживает getKeys
    console.log('🗑️ Очищаем старые скелетоны из localStorage...');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('skeleton_')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const data = JSON.parse(value);
            if (now - data.timestamp > maxAge) {
              console.log('🗑️ Удаляем старый скелетон из localStorage:', key);
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          console.error('❌ Ошибка при проверке возраста скелетона localStorage:', e);
          // Удаляем поврежденные данные
          localStorage.removeItem(key);
        }
      }
    });
  }, []);

  return {
    isStorageAvailable,
    saveSkeletonData,
    loadSkeletonData,
    saveSecureData,
    loadSecureData,
    clearOldSkeletons,
  };
};
