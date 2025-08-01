
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
    hapticFeedback
  } = useTelegramWebApp();
  const { user } = useAuth();

  useEffect(() => {
    if (isTelegramWebApp && webApp) {
      console.log('🎨 Применяем нативную тему Telegram');
      
      // Применяем цветовую схему Telegram к body
      const body = document.body;
      if (colorScheme === 'dark') {
        body.classList.add('dark');
        body.style.backgroundColor = 'var(--tg-theme-bg-color, #1a1a1a)';
        body.style.color = 'var(--tg-theme-text-color, #ffffff)';
      } else {
        body.classList.remove('dark');
        body.style.backgroundColor = 'var(--tg-theme-bg-color, #ffffff)';
        body.style.color = 'var(--tg-theme-text-color, #000000)';
      }

      // Отключаем стандартные стили прокрутки для мобильного
      body.style.overscrollBehavior = 'none';
      body.style.userSelect = 'none';
      body.style.webkitUserSelect = 'none';
      
      // Настраиваем viewport для Telegram
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }
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
    }
  }, [isTelegramWebApp, user, hideMainButton, showBackButton, hapticFeedback]);

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
          e.preventDefault();
        }
      };

      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [isTelegramWebApp]);

  return (
    <div 
      className={`min-h-screen ${isTelegramWebApp ? 'telegram-webapp' : ''}`}
      style={{
        backgroundColor: isTelegramWebApp ? 'var(--tg-theme-bg-color)' : undefined,
        color: isTelegramWebApp ? 'var(--tg-theme-text-color)' : undefined,
      }}
    >
      {children}
    </div>
  );
};

export default TelegramNativeWrapper;
