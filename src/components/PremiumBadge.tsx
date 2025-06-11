
import React from 'react';
import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({ 
  size = 'sm', 
  variant = 'default' 
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <Badge 
      variant={variant}
      className={`
        bg-gradient-to-r from-yellow-400 to-orange-500 
        text-white border-0 font-medium
        ${sizeClasses[size]}
      `}
    >
      <Crown className={`${iconSizes[size]} mr-1`} />
      Premium
    </Badge>
  );
};

export default PremiumBadge;
