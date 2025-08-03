
import React, { ReactNode } from 'react';
import { useTelegramViewport } from '@/hooks/useTelegramViewport';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

interface TelegramSafeAreaProps {
  children: ReactNode;
  className?: string;
  includeMainButton?: boolean;
  includeBackButton?: boolean;
}

const TelegramSafeArea: React.FC<TelegramSafeAreaProps> = ({
  children,
  className = '',
  includeMainButton = false,
  includeBackButton = false,
}) => {
  const { viewport } = useTelegramViewport();
  const { webApp, isTelegramWebApp } = useTelegramWebApp();

  const getSafeAreaStyle = () => {
    if (!isTelegramWebApp) {
      return {
        minHeight: '100vh',
        paddingBottom: includeMainButton ? '80px' : '0',
        overflowY: 'auto' as const,
      };
    }

    const style: React.CSSProperties = {
      minHeight: viewport.height,
      paddingBottom: includeMainButton ? '60px' : '0',
      paddingTop: includeBackButton ? '0' : 'env(safe-area-inset-top, 0px)',
      overflowY: 'auto',
      overscrollBehavior: 'none',
      WebkitOverflowScrolling: 'touch',
    };

    // Учитываем состояние главной кнопки
    if (includeMainButton && webApp?.MainButton?.isVisible) {
      style.paddingBottom = '60px';
    }

    return style;
  };

  return (
    <div 
      className={`telegram-safe-area ${className}`}
      style={getSafeAreaStyle()}
      data-scrollable="true"
    >
      {children}
    </div>
  );
};

export default TelegramSafeArea;
