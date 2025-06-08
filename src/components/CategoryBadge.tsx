
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CategoryBadgeProps {
  category: 'Rollers' | 'BMX' | 'Skateboard';
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const categoryConfig = {
    Rollers: { label: 'Роллеры', emoji: '⛸️', color: 'bg-blue-100 text-blue-800' },
    BMX: { label: 'BMX', emoji: '🚴', color: 'bg-green-100 text-green-800' },
    Skateboard: { label: 'Скейтборд', emoji: '🛹', color: 'bg-orange-100 text-orange-800' },
  };

  const config = categoryConfig[category];

  return (
    <Badge className={`${config.color} text-xs px-2 py-1`}>
      <span className="mr-1">{config.emoji}</span>
      {config.label}
    </Badge>
  );
};

export default CategoryBadge;
