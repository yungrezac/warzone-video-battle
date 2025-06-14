
-- Создаем таблицу для баннеров главной страницы
CREATE TABLE IF NOT EXISTS public.home_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  show_frequency INTEGER NOT NULL DEFAULT 3, -- Показывать каждый N-й раз (чтобы не сильно назойливо)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем индекс для сортировки баннеров
CREATE INDEX IF NOT EXISTS idx_home_banners_order 
ON public.home_banners(order_index, created_at);

-- Добавляем RLS политики для баннеров
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

-- Политика для чтения баннеров (доступно всем)
CREATE POLICY "Anyone can view active home banners" 
  ON public.home_banners 
  FOR SELECT 
  USING (is_active = true);

-- Политика для создания баннеров (только админы)
CREATE POLICY "Admins can create home banners" 
  ON public.home_banners 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (telegram_username = 'rollertricksby' OR username = 'TrickMaster' OR telegram_username = 'TrickMaster')
    )
  );

-- Политика для обновления баннеров (только админы)
CREATE POLICY "Admins can update home banners" 
  ON public.home_banners 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (telegram_username = 'rollertricksby' OR username = 'TrickMaster' OR telegram_username = 'TrickMaster')
    )
  );

-- Политика для удаления баннеров (только админы)
CREATE POLICY "Admins can delete home banners" 
  ON public.home_banners 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (telegram_username = 'rollertricksby' OR username = 'TrickMaster' OR telegram_username = 'TrickMaster')
    )
  );
