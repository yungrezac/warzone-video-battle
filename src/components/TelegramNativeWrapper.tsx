
import React, { useEffect, ReactNode } from 'react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useTelegramTheme } from '@/hooks/useTelegramTheme';
import { useTelegramViewport } from '@/hooks/useTelegramViewport';
import { useAuth } from './AuthWrapper';
import TelegramDeepLink from './TelegramDeepLink';

interface TelegramNativeWrapperProps {
  children: ReactNode;
}

const TelegramNativeWrapper: React.FC<TelegramNativeWrapperProps> = ({ children }) => {
  const { 
    webApp, 
    isTelegramWebApp, 
    colorScheme,
    hapticFeedback,
    platform,
    version,
    showPopup,
    setSettingsButton
  } = useTelegramWebApp();
  
  const { themeColors, isDark } = useTelegramTheme();
  const { viewport, expand } = useTelegramViewport();
  const { user } = useAuth();

  // Расширенная настройка WebApp
  useEffect(() => {
    if (isTelegramWebApp && webApp) {
      console.log('🚀 Расширенная инициализация Telegram WebApp');
      
      // Применяем все доступные настройки
      const root = document.documentElement;
      const body = document.body;
      
      // Устанавливаем все CSS переменные темы
      Object.entries(themeColors).forEach(([key, value]) => {
        root.style.setProperty(`--tg-theme-${key.replace('_', '-')}`, value);
      });

      // Расширенные стили для нативного вида
      body.style.backgroundColor = themeColors.bg_color;
      body.style.color = themeColors.text_color;
      body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      
      // Улучшенные настройки для мобильных устройств
      body.style.overscrollBehavior = 'none';
      body.style.userSelect = 'none';
      body.style.touchAction = 'pan-y';
      body.style.webkitTapHighlightColor = 'transparent';
      body.style.webkitUserSelect = 'none';
      body.style.webkitTouchCallout = 'none';

      // Настройка viewport
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content'
        );
      }

      // Применяем тему
      if (isDark) {
        body.classList.add('dark');
        root.classList.add('dark');
      } else {
        body.classList.remove('dark');
        root.classList.remove('dark');
      }

      // Настройка цветов заголовка и фона
      if (webApp.setHeaderColor) {
        webApp.setHeaderColor(themeColors.header_bg_color || themeColors.bg_color);
      }
      if (webApp.setBackgroundColor) {
        webApp.setBackgroundColor(themeColors.bg_color);
      }

      // Включаем подтверждение закрытия
      webApp.enableClosingConfirmation();

      // Расширяем на весь экран
      if (!webApp.isExpanded) {
        expand();
      }

      console.log('✅ Расширенная настройка Telegram WebApp завершена:', {
        platform,
        version,
        colorScheme,
        viewport: `${viewport.height}x${viewport.viewport}`,
        themeVars: Object.keys(themeColors).length
      });
    }
  }, [isTelegramWebApp, webApp, themeColors, isDark, platform, version, viewport, expand]);

  // Настройка пользовательских функций
  useEffect(() => {
    if (isTelegramWebApp && user && webApp) {
      console.log('👤 Настройка персонализированных функций для:', user.first_name);
      
      // Показываем кнопку настроек с расширенными функциями
      setSettingsButton(true, () => {
        hapticFeedback('selection');
        
        showPopup({
          title: '⚙️ Настройки TRICKS',
          message: 'Выберите раздел настроек:',
          buttons: [
            { type: 'default', text: '🔔 Уведомления', id: 'notifications' },
            { type: 'default', text: '🎵 Звук и вибрация', id: 'haptic' },
            { type: 'default', text: '📱 Разрешения', id: 'permissions' },
            { type: 'default', text: '🌐 О приложении', id: 'about' },
            { type: 'close', text: 'Закрыть' }
          ]
        }, (buttonId) => {
          hapticFeedback('impact');
          console.log('⚙️ Выбран раздел настроек:', buttonId);
          
          switch (buttonId) {
            case 'about':
              showPopup({
                title: '🎮 TRICKS',
                message: `Версия: 2.0\nПлатформа: ${platform}\nTelegram: ${version}\nПользователь: ${user.first_name}`,
                buttons: [{ type: 'close', text: 'OK' }]
              });
              break;
          }
        });
      });

      // Обработчики специальных событий Telegram
      const handleMainButtonClick = () => {
        hapticFeedback('impact');
        console.log('🔘 Main button clicked');
      };

      const handleBackButtonClick = () => {
        hapticFeedback('impact');
        console.log('🔙 Back button clicked');
      };

      const handleSettingsButtonClick = () => {
        hapticFeedback('selection');
        console.log('⚙️ Settings button clicked');
      };

      // Подписываемся на события
      webApp.onEvent('mainButtonClicked', handleMainButtonClick);
      webApp.onEvent('backButtonClicked', handleBackButtonClick);
      webApp.onEvent('settingsButtonClicked', handleSettingsButtonClick);

      return () => {
        webApp.offEvent('mainButtonClicked', handleMainButtonClick);
        webApp.offEvent('backButtonClicked', handleBackButtonClick);
        webApp.offEvent('settingsButtonClicked', handleSettingsButtonClick);
      };
    }
  }, [isTelegramWebApp, user, webApp, hapticFeedback, showPopup, setSettingsButton, platform, version]);

  // Улучшенная обработка жестов и событий
  useEffect(() => {
    if (isTelegramWebApp && webApp) {
      let touchStartY = 0;
      let touchStartTime = 0;
      
      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          touchStartY = e.touches[0].clientY;
          touchStartTime = Date.now();
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault();
          return;
        }

        const target = e.target as Element;
        const scrollableParent = target.closest('[data-scrollable="true"], .telegram-scroll-container, .overflow-y-auto');
        
        if (!scrollableParent) {
          const currentY = e.touches[0].clientY;
          const deltaY = currentY - touchStartY;
          const timeDelta = Date.now() - touchStartTime;
          
          // Предотвращаем bounce только для быстрых свайпов
          if (Math.abs(deltaY) > 50 && timeDelta < 300) {
            e.preventDefault();
          }
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        // Легкая вибрация при касании
        if (e.target && (e.target as Element).matches('button, [role="button"], .telegram-haptic-button')) {
          hapticFeedback('selection');
        }
      };

      const handleContextMenu = (e: Event) => {
        e.preventDefault();
      };

      // Обработчик изменения темы
      const handleThemeChange = () => {
        console.log('🎨 Тема изменена на:', webApp.colorScheme);
        hapticFeedback('selection');
      };

      // Обработчик изменения viewport
      const handleViewportChange = () => {
        console.log('📱 Viewport изменен:', {
          height: webApp.viewportHeight,
          stable: webApp.viewportStableHeight,
          expanded: webApp.isExpanded
        });
      };

      // Добавляем обработчики
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
      document.addEventListener('contextmenu', handleContextMenu, { passive: false });
      
      webApp.onEvent('themeChanged', handleThemeChange);
      webApp.onEvent('viewportChanged', handleViewportChange);

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('contextmenu', handleContextMenu);
        
        webApp.offEvent('themeChanged', handleThemeChange);
        webApp.offEvent('viewportChanged', handleViewportChange);
      };
    }
  }, [isTelegramWebApp, webApp, hapticFeedback]);

  return (
    <div 
      className={`
        min-h-screen telegram-scroll-container telegram-native-app
        ${isTelegramWebApp ? 'telegram-webapp telegram-enhanced' : 'web-browser'}
      `}
      data-scrollable="true"
      style={{
        backgroundColor: themeColors.bg_color,
        color: themeColors.text_color,
        minHeight: isTelegramWebApp ? '100dvh' : '100vh',
        overflowY: 'auto',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch',
        fontFamily: isTelegramWebApp 
          ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          : undefined,
      }}
    >
      {/* Deep Link Handler */}
      {isTelegramWebApp && <TelegramDeepLink />}
      
      {children}
    </div>
  );
};

export default TelegramNativeWrapper;
