
-- Создаем таблицу для банеров турниров
CREATE TABLE IF NOT EXISTS public.tournament_banners (
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
CREATE INDEX IF NOT EXISTS idx_tournament_banners_order 
ON public.tournament_banners(order_index, created_at);

-- Добавляем RLS политики для банеров
ALTER TABLE public.tournament_banners ENABLE ROW LEVEL SECURITY;

-- Политика для чтения банеров (доступно всем)
CREATE POLICY "Anyone can view active tournament banners" 
  ON public.tournament_banners 
  FOR SELECT 
  USING (is_active = true);

-- Политика для создания банеров (только админы)
CREATE POLICY "Admins can create tournament banners" 
  ON public.tournament_banners 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (telegram_username = 'rollertricksby' OR username = 'TrickMaster' OR telegram_username = 'TrickMaster')
    )
  );

-- Политика для обновления банеров (только админы)
CREATE POLICY "Admins can update tournament banners" 
  ON public.tournament_banners 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (telegram_username = 'rollertricksby' OR username = 'TrickMaster' OR telegram_username = 'TrickMaster')
    )
  );

-- Политика для удаления банеров (только админы)
CREATE POLICY "Admins can delete tournament banners" 
  ON public.tournament_banners 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (telegram_username = 'rollertricksby' OR username = 'TrickMaster' OR telegram_username = 'TrickMaster')
    )
  );
