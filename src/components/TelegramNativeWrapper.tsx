
import React, { useEffect, ReactNode } from 'react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useAuth } from './AuthWrapper';

interface TelegramNativeWrapperProps {
  children: ReactNode;
}

const TelegramNativeWrapper: React.FC<TelegramNativeWrapperProps> = ({ children }) => {
  const { 
    webApp, 
    isTelegramWebApp, 
    colorScheme,
    viewportHeight,
    isExpanded,
    showBackButton,
    hideBackButton,
    showSettingsButton,
    hideSettingsButton,
    hapticFeedback,
    expand
  } = useTelegramWebApp();
  const { user } = useAuth();

  useEffect(() => {
    if (isTelegramWebApp && webApp) {
      console.log('🎨 Применяем расширенную нативную тему Telegram');
      
      // Применяем цветовую схему Telegram к body
      const body = document.body;
      const root = document.documentElement;
      
      if (colorScheme === 'dark') {
        body.classList.add('dark');
        root.classList.add('dark');
      } else {
        body.classList.remove('dark');
        root.classList.remove('dark');
      }

      // Применяем CSS переменные темы
      const themeVars = {
        '--tg-viewport-height': `${viewportHeight}px`,
        '--tg-viewport-stable-height': `${webApp.viewportStableHeight}px`,
        '--tg-safe-area-inset-top': webApp.safeAreaInset?.top ? `${webApp.safeAreaInset.top}px` : '0px',
        '--tg-safe-area-inset-bottom': webApp.safeAreaInset?.bottom ? `${webApp.safeAreaInset.bottom}px` : '0px',
        '--tg-safe-area-inset-left': webApp.safeAreaInset?.left ? `${webApp.safeAreaInset.left}px` : '0px',
        '--tg-safe-area-inset-right': webApp.safeAreaInset?.right ? `${webApp.safeAreaInset.right}px` : '0px',
      };

      Object.entries(themeVars).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });

      // Настраиваем стили для мобильного приложения
      body.style.backgroundColor = 'var(--tg-theme-bg-color, #ffffff)';
      body.style.color = 'var(--tg-theme-text-color, #000000)';
      body.style.overscrollBehavior = 'none';
      body.style.userSelect = 'none';
      body.style.webkitUserSelect = 'none';
      body.style.webkitTouchCallout = 'none';
      body.style.webkitTapHighlightColor = 'transparent';
      
      // Настраиваем viewport для Telegram
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content'
        );
      }

      // Автоматически расширяем приложение если оно не развернуто
      if (!isExpanded) {
        expand();
      }
    }
  }, [isTelegramWebApp, webApp, colorScheme, viewportHeight, isExpanded, expand]);

  useEffect(() => {
    if (isTelegramWebApp && user) {
      console.log('👤 Настраиваем навигацию для авторизованного пользователя:', user.first_name);
      
      // Настраиваем кнопку "Назад"
      showBackButton(() => {
        hapticFeedback('impact');
        if (window.location.pathname !== '/') {
          window.history.back();
        } else {
          // Если мы на главной странице, показываем подтверждение выхода
          webApp?.showConfirm('Вы действительно хотите закрыть приложение?', (confirmed) => {
            if (confirmed) {
              webApp?.close();
            }
          });
        }
      });

      // Настраиваем кнопку настроек (если нужно)
      showSettingsButton(() => {
        hapticFeedback('selection');
        // Здесь можно открыть модальное окно настроек или перейти на страницу настроек
        console.log('Settings button clicked');
      });

      return () => {
        hideBackButton();
        hideSettingsButton();
      };
    }
  }, [isTelegramWebApp, user, showBackButton, hideBackButton, showSettingsButton, hideSettingsButton, hapticFeedback, webApp]);

  // Добавляем обработчики для нативных жестов и событий
  useEffect(() => {
    if (isTelegramWebApp) {
      const preventDefaultTouch = (e: TouchEvent) => {
        // Предотвращаем bounce effect и pull-to-refresh
        if (e.touches.length > 1) {
          e.preventDefault();
        }

        const touch = e.touches[0];
        const target = e.target as Element;
        
        // Разрешаем скролл только для элементов с data-scrollable
        if (!target.closest('[data-scrollable="true"]') && 
            !target.closest('.scrollable-content') && 
            !target.closest('input') && 
            !target.closest('textarea')) {
          
          // Проверяем, является ли это вертикальным движением в начале или конце страницы
          const isAtTop = window.scrollY <= 0;
          const isAtBottom = window.scrollY >= document.documentElement.scrollHeight - window.innerHeight;
          
          if ((isAtTop && touch.clientY > touch.clientY) || 
              (isAtBottom && touch.clientY < touch.clientY)) {
            e.preventDefault();
          }
        }
      };

      const preventDefaultWheel = (e: WheelEvent) => {
        // Предотвращаем скролл для элементов без data-scrollable
        const target = e.target as Element;
        if (!target.closest('[data-scrollable="true"]') && 
            !target.closest('.scrollable-content')) {
          e.preventDefault();
        }
      };

      document.addEventListener('touchstart', preventDefaultTouch, { passive: false });
      document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
      document.addEventListener('wheel', preventDefaultWheel, { passive: false });

      return () => {
        document.removeEventListener('touchstart', preventDefaultTouch);
        document.removeEventListener('touchmove', preventDefaultTouch);
        document.removeEventListener('wheel', preventDefaultWheel);
      };
    }
  }, [isTelegramWebApp]);

  // Добавляем CSS классы для Telegram-специфичных стилей
  const containerClasses = [
    'min-h-screen',
    'transition-all',
    'duration-300',
    isTelegramWebApp ? 'telegram-webapp' : '',
    isTelegramWebApp ? 'telegram-native' : '',
    colorScheme === 'dark' ? 'telegram-dark' : 'telegram-light',
  ].filter(Boolean).join(' ');

  const containerStyle: React.CSSProperties = {
    backgroundColor: isTelegramWebApp ? 'var(--tg-theme-bg-color)' : undefined,
    color: isTelegramWebApp ? 'var(--tg-theme-text-color)' : undefined,
    minHeight: isTelegramWebApp ? 'var(--tg-viewport-height, 100vh)' : '100vh',
    paddingTop: isTelegramWebApp ? 'var(--tg-safe-area-inset-top, 0px)' : undefined,
    paddingBottom: isTelegramWebApp ? 'var(--tg-safe-area-inset-bottom, 0px)' : undefined,
    paddingLeft: isTelegramWebApp ? 'var(--tg-safe-area-inset-left, 0px)' : undefined,
    paddingRight: isTelegramWebApp ? 'var(--tg-safe-area-inset-right, 0px)' : undefined,
  };

  return (
    <div className={containerClasses} style={containerStyle}>
      <div className="scrollable-content" data-scrollable="true">
        {children}
      </div>
    </div>
  );
};

export default TelegramNativeWrapper;
