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
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    hapticFeedback,
    setSettingsButton
  } = useTelegramWebApp();
  const { user } = useAuth();

  useEffect(() => {
    if (isTelegramWebApp && webApp) {
      console.log('🎨 Применяем нативную тему Telegram');
      
      // Применяем цветовую схему Telegram к body
      const body = document.body;
      const root = document.documentElement;
      
      if (colorScheme === 'dark') {
        body.classList.add('dark');
        root.classList.add('dark');
        body.style.backgroundColor = 'var(--tg-theme-bg-color, #1a1a1a)';
        body.style.color = 'var(--tg-theme-text-color, #ffffff)';
      } else {
        body.classList.remove('dark');
        root.classList.remove('dark');
        body.style.backgroundColor = 'var(--tg-theme-bg-color, #ffffff)';
        body.style.color = 'var(--tg-theme-text-color, #000000)';
      }

      // Отключаем стандартные стили прокрутки для мобильного
      body.style.overscrollBehavior = 'none';
      body.style.userSelect = 'none';
      (body.style as any).webkitUserSelect = 'none';
      (body.style as any).webkitTapHighlightColor = 'transparent';
      
      // Настраиваем viewport для Telegram
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }

      // Применяем CSS переменные для всех компонентов
      const themeVars = {
        '--background': colorScheme === 'dark' ? '240 10% 3.9%' : '0 0% 100%',
        '--foreground': colorScheme === 'dark' ? '0 0% 98%' : '240 10% 3.9%',
        '--primary': colorScheme === 'dark' ? '0 0% 98%' : '221.2 83.2% 53.3%',
        '--primary-foreground': colorScheme === 'dark' ? '240 5.9% 10%' : '210 40% 98%',
        '--card': colorScheme === 'dark' ? '240 10% 3.9%' : '0 0% 100%',
        '--card-foreground': colorScheme === 'dark' ? '0 0% 98%' : '240 10% 3.9%',
        '--border': colorScheme === 'dark' ? '240 3.7% 15.9%' : '214.3 31.8% 91.4%',
      };

      Object.entries(themeVars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }
  }, [isTelegramWebApp, webApp, colorScheme]);

  useEffect(() => {
    if (isTelegramWebApp && user) {
      console.log('👤 Пользователь авторизован в Telegram WebApp:', user.first_name);
      
      // Скрываем основную кнопку по умолчанию
      hideMainButton();
      
      // Устанавливаем обработчик для кнопки "Назад"
      showBackButton(() => {
        hapticFeedback('impact');
        // По умолчанию возвращаемся на главную страницу
        if (window.location.pathname !== '/') {
          window.history.back();
        }
      });

      // Показываем кнопку настроек
      setSettingsButton(true, () => {
        hapticFeedback('impact');
        console.log('Настройки открыты');
        // Здесь можно добавить логику открытия настроек
      });
    }
  }, [isTelegramWebApp, user, hideMainButton, showBackButton, hapticFeedback, setSettingsButton]);

  // Добавляем обработчики для нативных жестов
  useEffect(() => {
    if (isTelegramWebApp) {
      const handleTouchStart = (e: TouchEvent) => {
        // Предотвращаем bounce effect в Safari
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        // Предотвращаем скролл если это не основная область контента
        const target = e.target as Element;
        if (!target.closest('[data-scrollable="true"]')) {
          const touchY = e.touches[0].clientY;
          const element = target.closest('.telegram-scroll-container');
          
          if (element) {
            const { scrollTop, scrollHeight, clientHeight } = element as HTMLElement;
            const isAtTop = scrollTop === 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight;
            
            // Предотвращаем bounce только на краях
            if ((isAtTop && touchY > 0) || (isAtBottom && touchY < 0)) {
              e.preventDefault();
            }
          } else {
            e.preventDefault();
          }
        }
      };

      const handleContextMenu = (e: Event) => {
        // Отключаем контекстное меню на долгое нажатие
        e.preventDefault();
      };

      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('contextmenu', handleContextMenu, { passive: false });

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [isTelegramWebApp]);

  return (
    <div 
      className={`min-h-screen telegram-scroll-container ${isTelegramWebApp ? 'telegram-webapp' : ''}`}
      data-scrollable="true"
      style={{
        backgroundColor: isTelegramWebApp ? 'var(--tg-theme-bg-color)' : undefined,
        color: isTelegramWebApp ? 'var(--tg-theme-text-color)' : undefined,
        minHeight: isTelegramWebApp ? '100dvh' : '100vh',
      }}
    >
      {children}
    </div>
  );
};

export default TelegramNativeWrapper;
