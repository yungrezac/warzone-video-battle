-- Создаем функцию для автоматического запуска батлов
CREATE OR REPLACE FUNCTION public.auto_start_battles()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Обновляем статус батлов с 'registration' на 'active' когда время начала наступило
  UPDATE public.video_battles 
  SET status = 'active',
      updated_at = now()
  WHERE status = 'registration' 
    AND start_time <= now()
    AND start_time > now() - interval '1 hour'; -- не обновляем старые батлы
END;
$$;