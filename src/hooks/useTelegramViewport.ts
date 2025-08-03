
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

      window.addEventListener('resize', updateViewport);
      updateViewport();

      return () => window.removeEventListener('resize', updateViewport);
    }

    // Обновляем viewport данные
    const updateViewport = () => {
      setViewport({
        height: webApp.viewportHeight || window.innerHeight,
        stableHeight: webApp.viewportStableHeight || window.innerHeight,
        isExpanded: webApp.isExpanded || false,
      });
    };

    // Слушаем изменения viewport
    const handleViewportChanged = () => {
      console.log('📱 Viewport изменен в Telegram WebApp');
      updateViewport();
    };

    webApp.onEvent('viewportChanged', handleViewportChanged);
    updateViewport();

    // Расширяем приложение при первой загрузке
    if (webApp.expand && !webApp.isExpanded) {
      webApp.expand();
    }

    return () => {
      webApp.offEvent('viewportChanged', handleViewportChanged);
    };
  }, [webApp, isTelegramWebApp]);

  const expand = () => {
    if (webApp?.expand) {
      webApp.expand();
    }
  };

  const setViewportHeight = (height: number) => {
    if (isTelegramWebApp) {
      // В Telegram WebApp высоту устанавливает сама платформа
      return;
    }
    // Для веб-версии можно эмулировать изменение высоты
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
