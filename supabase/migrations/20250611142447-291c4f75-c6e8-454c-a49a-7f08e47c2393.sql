
-- Добавляем новые поля в таблицу market_items
ALTER TABLE public.market_items 
ADD COLUMN IF NOT EXISTS subcategory text,
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Обновляем существующие записи, чтобы у них были пустые массивы изображений
UPDATE public.market_items 
SET images = '[]'::jsonb 
WHERE images IS NULL;

-- Создаем индекс для быстрого поиска по категориям и подкатегориям
CREATE INDEX IF NOT EXISTS idx_market_items_category_subcategory 
ON public.market_items(category, subcategory);
