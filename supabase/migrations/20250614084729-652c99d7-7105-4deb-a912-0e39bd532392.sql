
-- Исправляем foreign key constraint в таблице points_history
-- Проблема в том, что points_history ссылается на auth.users, но должна ссылаться на profiles

-- Сначала удаляем существующий foreign key constraint
ALTER TABLE public.points_history 
DROP CONSTRAINT IF EXISTS points_history_user_id_fkey;

-- Добавляем правильный foreign key constraint, ссылающийся на profiles
ALTER TABLE public.points_history 
ADD CONSTRAINT points_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Также обновляем функции начисления баллов, чтобы они правильно обрабатывали ошибки
CREATE OR REPLACE FUNCTION public.award_points_for_action(
  p_user_id uuid,
  p_action_type text,
  p_points integer,
  p_description text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Проверяем, существует ли профиль пользователя
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE NOTICE 'Profile not found for user_id: %', p_user_id;
    RETURN;
  END IF;
  
  -- Начисляем баллы
  UPDATE public.user_points 
  SET 
    total_points = COALESCE(total_points, 0) + p_points,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Если записи нет, создаем её
  IF NOT FOUND THEN
    INSERT INTO public.user_points (user_id, total_points)
    VALUES (p_user_id, p_points);
  END IF;
  
  -- Записываем в историю
  INSERT INTO public.points_history (
    user_id, 
    points_change, 
    operation_type, 
    description,
    reference_id
  ) VALUES (
    p_user_id,
    p_points,
    p_action_type,
    COALESCE(p_description, 'Начисление баллов за ' || p_action_type),
    p_reference_id
  );
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE NOTICE 'Foreign key violation for user_id: %', p_user_id;
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in award_points_for_action: %', SQLERRM;
END;
$$;
