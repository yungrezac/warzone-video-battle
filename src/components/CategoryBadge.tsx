
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface CategoryBadgeProps {
  category: 'Rollers' | 'BMX' | 'Skateboard';
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const { t } = useTranslation();
  const categoryConfig = {
    Rollers: { label: t('category_rollers'), emoji: '⛸️', color: 'bg-blue-100 text-blue-800' },
    BMX: { label: t('category_bmx'), emoji: '🚴', color: 'bg-green-100 text-green-800' },
    Skateboard: { label: t('category_skateboard'), emoji: '🛹', color: 'bg-orange-100 text-orange-800' },
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
