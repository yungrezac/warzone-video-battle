
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
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
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
        text-white border-0
        ${sizeClasses[size]}
      `}
    >
      <Crown className={`${iconSizes[size]}`} />
    </Badge>
  );
};

export default PremiumBadge;
