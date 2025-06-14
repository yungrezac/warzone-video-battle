
CREATE OR REPLACE FUNCTION public.is_current_user_premium()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_premium_status BOOLEAN;
  v_telegram_id TEXT;
BEGIN
  -- Шаг 1: Получаем telegram_id текущего аутентифицированного пользователя из таблицы auth.users.
  -- Мы предполагаем, что telegram_id хранится в raw_user_meta_data.
  SELECT raw_user_meta_data->>'telegram_id'
  INTO v_telegram_id
  FROM auth.users
  WHERE id = auth.uid();

  -- Если мы не можем найти telegram_id для текущего пользователя, он не может быть премиум.
  IF v_telegram_id IS NULL THEN
    -- В качестве запасного варианта проверим, совпадает ли auth.uid() с id в профилях.
    -- Это для поддержки пользователей, созданных не через Telegram (например, админ).
    SELECT p.is_premium AND p.premium_expires_at > now()
    INTO is_premium_status
    FROM public.profiles p
    WHERE p.id = auth.uid();
    
    RETURN COALESCE(is_premium_status, false);
  END IF;

  -- Шаг 2: Используем telegram_id для поиска профиля пользователя и проверки его премиум-статуса.
  SELECT p.is_premium AND p.premium_expires_at > now()
  INTO is_premium_status
  FROM public.profiles p
  WHERE p.telegram_id = v_telegram_id;

  -- Возвращаем статус, по умолчанию false, если профиль не найден.
  RETURN COALESCE(is_premium_status, false);
END;
$$;
