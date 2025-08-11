
import { useCallback, useState } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export const useTelegramLocation = () => {
  const { webApp, isTelegramWebApp, hapticFeedback } = useTelegramWebApp();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!isTelegramWebApp || !webApp) {
      // Fallback для веб-версии
      if (!navigator.geolocation) {
        console.warn('Geolocation не поддерживается');
        return null;
      }

      return new Promise((resolve, reject) => {
        setIsGettingLocation(true);
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: Date.now(),
            };
            
            setLastLocation(location);
            setIsGettingLocation(false);
            resolve(location);
          },
          (error) => {
            console.error('Ошибка получения местоположения:', error);
            setIsGettingLocation(false);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 минут
          }
        );
      });
    }

    // Telegram WebApp location (если поддерживается)
    setIsGettingLocation(true);
    hapticFeedback('impact');

    try {
      // Используем веб API, так как Telegram WebApp API для location ограничен
      return await getCurrentLocation();
    } catch (error) {
      console.error('Ошибка получения местоположения в Telegram:', error);
      setIsGettingLocation(false);
      return null;
    }
  }, [webApp, isTelegramWebApp, hapticFeedback]);

  const formatLocation = useCallback((location: LocationData) => {
    return {
      coordinates: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      accuracy: location.accuracy ? `±${Math.round(location.accuracy)}м` : 'Неизвестно',
      timestamp: new Date(location.timestamp).toLocaleString('ru-RU'),
    };
  }, []);

  const getLocationString = useCallback((location: LocationData) => {
    return `📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }, []);

  return {
    getCurrentLocation,
    isGettingLocation,
    lastLocation,
    formatLocation,
    getLocationString,
    isAvailable: isTelegramWebApp || !!navigator.geolocation,
  };
};
