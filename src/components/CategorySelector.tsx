
import React from 'react';
import { Button } from '@/components/ui/button';

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
  const categories = [
    { value: 'Rollers' as const, label: 'Роллеры', emoji: '⛸️' },
    { value: 'BMX' as const, label: 'BMX', emoji: '🚴' },
    { value: 'Skateboard' as const, label: 'Скейтборд', emoji: '🛹' },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Направление *
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
