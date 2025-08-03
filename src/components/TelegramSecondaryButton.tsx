
import React, { useEffect } from 'react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

interface TelegramSecondaryButtonProps {
  show?: boolean;
  onClick?: () => void;
}

const TelegramSecondaryButton: React.FC<TelegramSecondaryButtonProps> = ({
  show = false,
  onClick
}) => {
  const { webApp, isTelegramWebApp, showBackButton, hideBackButton, hapticFeedback } = useTelegramWebApp();

  useEffect(() => {
    if (!isTelegramWebApp || !webApp) return;

    if (show && onClick) {
      const handleClick = () => {
        hapticFeedback('impact');
        onClick();
      };

      showBackButton(handleClick);
      
      return () => {
        hideBackButton();
      };
    } else {
      hideBackButton();
    }
  }, [show, onClick, isTelegramWebApp, webApp, showBackButton, hideBackButton, hapticFeedback]);

  // Этот компонент не рендерит ничего, так как управляет нативной кнопкой
  return null;
};

export default TelegramSecondaryButton;
