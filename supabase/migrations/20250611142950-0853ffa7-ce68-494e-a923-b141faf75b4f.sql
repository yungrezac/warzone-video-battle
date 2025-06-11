
-- Создаем таблицу для банеров маркета
CREATE TABLE IF NOT EXISTS public.market_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем индекс для сортировки банеров
CREATE INDEX IF NOT EXISTS idx_market_banners_order 
ON public.market_banners(order_index, created_at);

-- Добавляем RLS политики для банеров
ALTER TABLE public.market_banners ENABLE ROW LEVEL SECURITY;

-- Политика для чтения банеров (доступно всем)
CREATE POLICY "Anyone can view active banners" 
  ON public.market_banners 
  FOR SELECT 
  USING (is_active = true);

-- Политика для управления банерами (только админы)
CREATE POLICY "Admins can manage banners" 
  ON public.market_banners 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (telegram_username = 'rollertricksby' OR username = 'TrickMaster' OR telegram_username = 'TrickMaster')
    )
  );
