
import React, { useEffect, ReactNode } from 'react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useTelegramTheme } from '@/hooks/useTelegramTheme';
import { useAuth } from './AuthWrapper';

interface TelegramNativeWrapperProps {
  children: ReactNode;
}

const TelegramNativeWrapper: React.FC<TelegramNativeWrapperProps> = ({ children }) => {
  const { 
    webApp, 
    isTelegramWebApp, 
    colorScheme,
    hapticFeedback,
    setSettingsButton,
    platform,
    version
  } = useTelegramWebApp();
  const { themeColors, isDark } = useTelegramTheme();
  const { user } = useAuth();

  useEffect(() => {
    if (isTelegramWebApp && webApp) {
      console.log('🎨 Применяем расширенную нативную тему Telegram');
      
      // Применяем цветовую схему Telegram к body
      const body = document.body;
      const root = document.documentElement;
      
      // Устанавливаем основные цвета
      body.style.backgroundColor = themeColors.bg_color;
      body.style.color = themeColors.text_color;

      // Применяем класс темы
      if (isDark) {
        body.classList.add('dark');
        root.classList.add('dark');
      } else {
        body.classList.remove('dark');
        root.classList.remove('dark');
      }

      // Улучшенные настройки для мобильного
      body.style.overscrollBehavior = 'none';
      body.style.userSelect = 'none';
      (body.style as any).webkitUserSelect = 'none';
      (body.style as any).webkitTapHighlightColor = 'transparent';
      body.style.touchAction = 'pan-y';
      
      // Настройки для предотвращения зума
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }

      // Применяем все CSS переменные темы Telegram
      Object.entries(themeColors).forEach(([key, value]) => {
        root.style.setProperty(`--tg-theme-${key.replace('_', '-')}`, value);
      });

      // Устанавливаем цвета заголовка и фона приложения
      if (webApp.setHeaderColor) {
        webApp.setHeaderColor(themeColors.header_bg_color);
      }
      if (webApp.setBackgroundColor) {
        webApp.setBackgroundColor(themeColors.bg_color);
      }

      console.log('✅ Нативная тема Telegram применена:', {
        platform,
        version,
        colorScheme,
        themeColors: Object.keys(themeColors).length
      });
    }
  }, [isTelegramWebApp, webApp, themeColors, isDark, platform, version, colorScheme]);

  useEffect(() => {
    if (isTelegramWebApp && user && webApp) {
      console.log('👤 Настраиваем нативные элементы для пользователя:', user.first_name);
      
      // Включаем подтверждение закрытия
      webApp.enableClosingConfirmation();

      // Показываем кнопку настроек с нативным стилем
      setSettingsButton(true, () => {
        hapticFeedback('selection');
        console.log('⚙️ Нативные настройки открыты');
      });

      // Расширяем приложение на весь экран
      if (webApp.expand && !webApp.isExpanded) {
        webApp.expand();
      }
    }
  }, [isTelegramWebApp, user, webApp, setSettingsButton, hapticFeedback]);

  // Оптимизированные обработчики нативных жестов и событий
  useEffect(() => {
    if (isTelegramWebApp && webApp) {
      let isScrolling = false;
      
      // Предотвращение нежелательных жестов
      const preventDefaultGestures = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };

      const preventContextMenu = (e: Event) => {
        e.preventDefault();
      };

      const handleTouchStart = (e: TouchEvent) => {
        isScrolling = false;
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault();
          return;
        }
        
        const target = e.target as Element;
        const scrollableParent = target.closest('[data-scrollable="true"], .telegram-scroll-container');
        
        if (!scrollableParent) {
          e.preventDefault();
          return;
        }

        isScrolling = true;
        
        // Улучшенная логика для предотвращения bounce эффекта
        const element = scrollableParent as HTMLElement;
        const { scrollTop, scrollHeight, clientHeight } = element;
        
        const isAtTop = scrollTop <= 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
        
        const deltaY = e.touches[0].clientY;
        const startY = (e.target as any).startY || deltaY;
        
        if ((isAtTop && deltaY > startY) || (isAtBottom && deltaY < startY)) {
          e.preventDefault();
        }
      };

      const handleTouchEnd = () => {
        isScrolling = false;
      };

      // Добавляем обработчики событий с passive: false только там где нужно
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
      document.addEventListener('touchstart', preventDefaultGestures, { passive: false });
      document.addEventListener('contextmenu', preventContextMenu, { passive: false });
      
      // Обработчик изменения темы
      const handleThemeChange = () => {
        console.log('🎨 Тема изменена на:', webApp.colorScheme);
        hapticFeedback('selection');
      };

      webApp.onEvent('themeChanged', handleThemeChange);

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchstart', preventDefaultGestures);
        document.removeEventListener('contextmenu', preventContextMenu);
        webApp.offEvent('themeChanged', handleThemeChange);
      };
    }
  }, [isTelegramWebApp, webApp, hapticFeedback]);

  return (
    <div 
      className={`
        min-h-screen telegram-scroll-container telegram-native-app
        ${isTelegramWebApp ? 'telegram-webapp' : ''}
      `}
      data-scrollable="true"
      style={{
        backgroundColor: themeColors.bg_color,
        color: themeColors.text_color,
        minHeight: isTelegramWebApp ? '100dvh' : '100vh',
        overflowY: 'auto',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {children}
    </div>
  );
};

export default TelegramNativeWrapper;
