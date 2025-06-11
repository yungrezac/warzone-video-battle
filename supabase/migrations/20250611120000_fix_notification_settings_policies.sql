
-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Users can manage their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;

-- Включаем RLS для таблицы notification_settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Создаем политики для notification_settings
CREATE POLICY "Users can view their own notification settings" 
  ON public.notification_settings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own notification settings" 
  ON public.notification_settings 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own notification settings" 
  ON public.notification_settings 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete their own notification settings" 
  ON public.notification_settings 
  FOR DELETE 
  USING (true);
