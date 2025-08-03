
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

      // Расширенные настройки для мобильного
      body.style.overscrollBehavior = 'none';
      body.style.userSelect = 'none';
      (body.style as any).webkitUserSelect = 'none';
      (body.style as any).webkitTapHighlightColor = 'transparent';
      body.style.touchAction = 'manipulation';
      
      // Настройки для предотвращения зума
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content'
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

  // Улучшенные обработчики нативных жестов и событий
  useEffect(() => {
    if (isTelegramWebApp && webApp) {
      // Предотвращение нежелательных жестов
      const preventDefaultGestures = (e: TouchEvent) => {
        // Предотвращаем масштабирование при множественном касании
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };

      const preventContextMenu = (e: Event) => {
        e.preventDefault();
      };

      const handleTouchMove = (e: TouchEvent) => {
        const target = e.target as Element;
        const scrollableParent = target.closest('[data-scrollable="true"]');
        
        if (!scrollableParent) {
          e.preventDefault();
          return;
        }

        // Улучшенная логика для предотвращения bounce эффекта
        const element = scrollableParent as HTMLElement;
        const { scrollTop, scrollHeight, clientHeight } = element;
        const touchY = e.touches[0].clientY;
        const startY = e.touches[0].pageY;
        
        const isAtTop = scrollTop <= 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
        
        if ((isAtTop && startY < touchY) || (isAtBottom && startY > touchY)) {
          e.preventDefault();
        }
      };

      // Добавляем обработчики событий
      document.addEventListener('touchstart', preventDefaultGestures, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('contextmenu', preventContextMenu, { passive: false });
      
      // Обработчик изменения темы
      const handleThemeChange = () => {
        console.log('🎨 Тема изменена на:', webApp.colorScheme);
        hapticFeedback('selection');
      };

      webApp.onEvent('themeChanged', handleThemeChange);

      return () => {
        document.removeEventListener('touchstart', preventDefaultGestures);
        document.removeEventListener('touchmove', handleTouchMove);
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
      }}
    >
      {children}
    </div>
  );
};

export default TelegramNativeWrapper;
