
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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('category_selector_label')}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {categories.map((category) => (
          <Button
            key={category.value}
            type="button"
            variant={selectedCategory === category.value ? "default" : "outline"}
            onClick={() => onCategoryChange(category.value)}
            disabled={disabled}
            className="flex flex-col items-center p-3 h-auto"
          >
            <span className="text-lg mb-1">{category.emoji}</span>
            <span className="text-xs">{category.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
