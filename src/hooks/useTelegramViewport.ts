
import { useEffect, useState } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';

export const useTelegramViewport = () => {
  const { webApp, isTelegramWebApp } = useTelegramWebApp();
  const [viewport, setViewport] = useState({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    stableHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    isExpanded: false,
  });

  useEffect(() => {
    if (!isTelegramWebApp || !webApp) {
      // Fallback для обычного браузера
      const updateViewport = () => {
        setViewport({
          height: window.innerHeight,
          stableHeight: window.innerHeight,
          isExpanded: true,
        });
      };

      const debouncedUpdate = debounce(updateViewport, 100);
      window.addEventListener('resize', debouncedUpdate);
      updateViewport();

      return () => window.removeEventListener('resize', debouncedUpdate);
    }

    // Обновляем viewport данные
    const updateViewport = () => {
      const newViewport = {
        height: webApp.viewportHeight || window.innerHeight,
        stableHeight: webApp.viewportStableHeight || window.innerHeight,
        isExpanded: webApp.isExpanded || false,
      };
      
      setViewport(prev => {
        // Избегаем лишних обновлений
        if (prev.height === newViewport.height && 
            prev.stableHeight === newViewport.stableHeight && 
            prev.isExpanded === newViewport.isExpanded) {
          return prev;
        }
        return newViewport;
      });
    };

    // Debounced обработчик для избежания спама событий
    const debouncedViewportHandler = debounce(() => {
      console.log('📱 Viewport изменен в Telegram WebApp');
      updateViewport();
    }, 150);

    webApp.onEvent('viewportChanged', debouncedViewportHandler);
    updateViewport();

    // Расширяем приложение при первой загрузке
    if (webApp.expand && !webApp.isExpanded) {
      webApp.expand();
    }

    return () => {
      webApp.offEvent('viewportChanged', debouncedViewportHandler);
    };
  }, [webApp, isTelegramWebApp]);

  const expand = () => {
    if (webApp?.expand) {
      webApp.expand();
    }
  };

  const setViewportHeight = (height: number) => {
    if (isTelegramWebApp) {
      return;
    }
    setViewport(prev => ({ ...prev, height }));
  };

  return {
    viewport,
    expand,
    setViewportHeight,
    isMobile: viewport.height < 600,
    isTablet: viewport.height >= 600 && viewport.height < 900,
    isDesktop: viewport.height >= 900,
  };
};

// Utility функция debounce
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
