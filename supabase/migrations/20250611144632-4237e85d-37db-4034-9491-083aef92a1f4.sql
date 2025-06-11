
-- Удаляем существующие политики для market_banners
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.market_banners;
DROP POLICY IF EXISTS "Admins can manage banners" ON public.market_banners;

-- Создаем новые политики для банеров
-- Политика для чтения банеров (доступно всем)
CREATE POLICY "Anyone can view active banners" 
  ON public.market_banners 
  FOR SELECT 
  USING (is_active = true);

-- Политика для создания банеров (только админы)
CREATE POLICY "Admins can create banners" 
  ON public.market_banners 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (telegram_username = 'rollertricksby' OR username = 'TrickMaster' OR telegram_username = 'TrickMaster')
    )
  );

-- Политика для обновления банеров (только админы)
CREATE POLICY "Admins can update banners" 
  ON public.market_banners 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (telegram_username = 'rollertricksby' OR username = 'TrickMaster' OR telegram_username = 'TrickMaster')
    )
  );

-- Политика для удаления банеров (только админы)
CREATE POLICY "Admins can delete banners" 
  ON public.market_banners 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (telegram_username = 'rollertricksby' OR username = 'TrickMaster' OR telegram_username = 'TrickMaster')
    )
  );
