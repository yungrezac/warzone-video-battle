
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface CategorySelectorProps {
  selectedCategory: 'Rollers' | 'BMX' | 'Skateboard';
  onCategoryChange: (category: 'Rollers' | 'BMX' | 'Skateboard') => void;
  disabled?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const categories = [
    { value: 'Rollers' as const, label: t('category_rollers'), emoji: '⛸️' },
    { value: 'BMX' as const, label: t('category_bmx'), emoji: '🚴' },
    { value: 'Skateboard' as const, label: t('category_skateboard'), emoji: '🛹' },
  ];

  return (
    <div className="flex justify-center gap-2 my-4">
      {categories.map((category) => (
        <Button
          key={category.value}
          variant={selectedCategory === category.value ? 'default' : 'outline'}
          onClick={() => onCategoryChange(category.value)}
          disabled={disabled}
          className="flex-1"
        >
          <span className="mr-2">{category.emoji}</span>
          {category.label}
        </Button>
      ))}
    </div>
  );
};

export default CategorySelector;
