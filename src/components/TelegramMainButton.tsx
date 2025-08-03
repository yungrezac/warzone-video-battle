
import React, { useEffect, useState } from 'react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

interface TelegramMainButtonProps {
  text: string;
  onClick: () => void;
  show?: boolean;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
  textColor?: string;
}

const TelegramMainButton: React.FC<TelegramMainButtonProps> = ({
  text,
  onClick,
  show = true,
  disabled = false,
  loading = false,
  color,
  textColor
}) => {
  const { webApp, isTelegramWebApp, showMainButton, hideMainButton } = useTelegramWebApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isTelegramWebApp || !webApp?.MainButton) return;

    if (show) {
      // Настраиваем параметры кнопки
      webApp.MainButton.setParams({
        text,
        color: color || 'var(--tg-theme-button-color)',
        text_color: textColor || 'var(--tg-theme-button-text-color)',
        is_active: !disabled,
        is_visible: true
      });

      // Управляем состоянием загрузки
      if (loading) {
        webApp.MainButton.showProgress();
      } else {
        webApp.MainButton.hideProgress();
      }

      // Устанавливаем обработчик клика
      const handleClick = () => {
        if (!disabled && !loading) {
          onClick();
        }
      };

      webApp.MainButton.onClick(handleClick);
      webApp.MainButton.show();
      setIsVisible(true);

      // Очистка при размонтировании
      return () => {
        webApp.MainButton.offClick(handleClick);
      };
    } else {
      webApp.MainButton.hide();
      setIsVisible(false);
    }
  }, [webApp, isTelegramWebApp, text, onClick, show, disabled, loading, color, textColor]);

  // Fallback для веб-версии
  if (!isTelegramWebApp && show) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50">
        <button
          onClick={() => !disabled && !loading && onClick()}
          disabled={disabled || loading}
          className="w-full py-4 px-6 text-white font-semibold rounded-lg shadow-lg transition-all"
          style={{
            backgroundColor: color || 'var(--tg-theme-button-color)',
            color: textColor || 'var(--tg-theme-button-text-color)',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {loading ? 'Загрузка...' : text}
        </button>
      </div>
    );
  }

  return null;
};

export default TelegramMainButton;
