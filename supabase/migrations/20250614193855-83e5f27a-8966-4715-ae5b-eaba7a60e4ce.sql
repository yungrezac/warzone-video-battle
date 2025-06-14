
-- Удаляем старую некорректную связь
ALTER TABLE public.user_market_items DROP CONSTRAINT IF EXISTS user_market_items_user_id_fkey;

-- Добавляем новую, правильную связь с таблицей профилей
ALTER TABLE public.user_market_items 
ADD CONSTRAINT user_market_items_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
