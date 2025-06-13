
import React from 'react';
import { Button } from '@/components/ui/button';

export type Category = "Rollers" | "BMX" | "Skateboard";
export type CategoryWithAll = "all" | Category;

interface CategorySelectorProps {
  selectedCategory: CategoryWithAll;
  onCategoryChange: (category: CategoryWithAll) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const categories: { key: CategoryWithAll; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'Rollers', label: 'Ролики' },
    { key: 'BMX', label: 'BMX' },
    { key: 'Skateboard', label: 'Скейт' },
  ];

  return (
    <div className="flex gap-2 mb-4 overflow-x-auto">
      {categories.map(({ key, label }) => (
        <Button
          key={key}
          variant={selectedCategory === key ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(key)}
          className="whitespace-nowrap"
        >
          {label}
        </Button>
      ))}
    </div>
  );
};

export default CategorySelector;
