
-- Удаляем старое ограничение на target_audience
ALTER TABLE public.user_market_items DROP CONSTRAINT IF EXISTS user_market_items_target_audience_check;

-- Добавляем новое ограничение с правильными значениями
ALTER TABLE public.user_market_items ADD CONSTRAINT user_market_items_target_audience_check 
CHECK (target_audience IN ('роллеры', 'бмх', 'скейт'));

-- Также добавим ограничение для категорий
ALTER TABLE public.user_market_items DROP CONSTRAINT IF EXISTS user_market_items_category_check;
ALTER TABLE public.user_market_items ADD CONSTRAINT user_market_items_category_check 
CHECK (category IN ('защита', 'колеса', 'подшипники', 'одежда', 'аксессуары', 'запчасти', 'другое'));
