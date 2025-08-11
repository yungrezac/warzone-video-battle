
import { useCallback, useState } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';

export const useTelegramBiometric = () => {
  const { webApp, isTelegramWebApp, hapticFeedback } = useTelegramWebApp();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    if (!isTelegramWebApp || !webApp) {
      console.warn('Biometric authentication недоступна');
      return false;
    }

    // Проверяем доступность биометрии в Telegram WebApp
    // Это экспериментальная функция, может не работать во всех версиях
    if (!(webApp as any).BiometricManager) {
      console.warn('BiometricManager недоступен в этой версии Telegram');
      return false;
    }

    setIsAuthenticating(true);
    hapticFeedback('impact');

    try {
      return new Promise<boolean>((resolve) => {
        const biometric = (webApp as any).BiometricManager;
        
        biometric.authenticate({
          reason: reason || 'Подтвердите вход в TRICKS'
        }, (result: any) => {
          setIsAuthenticating(false);
          
          if (result.success) {
            hapticFeedback('notification');
            console.log('✅ Биометрическая аутентификация успешна');
            resolve(true);
          } else {
            console.log('❌ Биометрическая аутентификация отклонена');
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Ошибка биометрической аутентификации:', error);
      setIsAuthenticating(false);
      return false;
    }
  }, [webApp, isTelegramWebApp, hapticFeedback]);

  const isAvailable = useCallback(() => {
    return isTelegramWebApp && 
           webApp && 
           (webApp as any).BiometricManager &&
           (webApp as any).BiometricManager.isInited;
  }, [webApp, isTelegramWebApp]);

  return {
    authenticate,
    isAuthenticating,
    isAvailable: isAvailable(),
  };
};
