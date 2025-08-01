
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { cn } from '@/lib/utils';

interface TelegramButtonProps extends ButtonProps {
  hapticType?: 'impact' | 'notification' | 'selection';
  useNativeStyle?: boolean;
}

const TelegramButton: React.FC<TelegramButtonProps> = ({ 
  children, 
  onClick, 
  hapticType = 'impact',
  useNativeStyle = false,
  className,
  ...props 
}) => {
  const { isTelegramWebApp, hapticFeedback } = useTelegramWebApp();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isTelegramWebApp) {
      hapticFeedback(hapticType);
    }
    onClick?.(e);
  };

  const nativeButtonStyle = useNativeStyle && isTelegramWebApp ? {
    backgroundColor: 'var(--tg-theme-button-color)',
    color: 'var(--tg-theme-button-text-color)',
    border: 'none',
    borderRadius: '8px',
  } : {};

  return (
    <Button
      {...props}
      onClick={handleClick}
      className={cn(
        className,
        useNativeStyle && isTelegramWebApp && 'border-0 shadow-none'
      )}
      style={{
        ...nativeButtonStyle,
        ...props.style,
      }}
    >
      {children}
    </Button>
  );
};

export default TelegramButton;
