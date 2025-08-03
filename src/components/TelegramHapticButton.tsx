
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { cn } from '@/lib/utils';

interface TelegramHapticButtonProps extends ButtonProps {
  hapticType?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
  hapticFeedback?: 'impact' | 'notification' | 'selection';
  notificationType?: 'error' | 'success' | 'warning';
  useNativeStyle?: boolean;
  longPressAction?: () => void;
  longPressDelay?: number;
}

const TelegramHapticButton: React.FC<TelegramHapticButtonProps> = ({ 
  children, 
  onClick, 
  hapticType = 'medium',
  hapticFeedback = 'impact',
  notificationType = 'success',
  useNativeStyle = true,
  longPressAction,
  longPressDelay = 800,
  className,
  disabled,
  ...props 
}) => {
  const { isTelegramWebApp, webApp } = useTelegramWebApp();
  const [pressTimer, setPressTimer] = React.useState<NodeJS.Timeout | null>(null);

  const triggerHaptic = () => {
    if (!isTelegramWebApp || !webApp?.HapticFeedback) return;

    switch (hapticFeedback) {
      case 'impact':
        webApp.HapticFeedback.impactOccurred(hapticType);
        break;
      case 'notification':
        webApp.HapticFeedback.notificationOccurred(notificationType);
        break;
      case 'selection':
        webApp.HapticFeedback.selectionChanged();
        break;
    }
  };

  const handleMouseDown = () => {
    if (disabled || !longPressAction) return;
    
    const timer = setTimeout(() => {
      triggerHaptic();
      longPressAction();
    }, longPressDelay);
    
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    triggerHaptic();
    onClick?.(e);
  };

  const nativeButtonStyle = useNativeStyle && isTelegramWebApp ? {
    backgroundColor: 'var(--tg-theme-button-color)',
    color: 'var(--tg-theme-button-text-color)',
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } : {};

  return (
    <Button
      {...props}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      disabled={disabled}
      className={cn(
        'haptic-button transition-all duration-200',
        useNativeStyle && isTelegramWebApp && 'telegram-native-button border-0 shadow-lg',
        disabled && 'opacity-50 cursor-not-allowed',
        className
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

export default TelegramHapticButton;
