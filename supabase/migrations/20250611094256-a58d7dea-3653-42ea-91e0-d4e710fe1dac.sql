
-- Создаем таблицу для заданий
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  telegram_channel_url TEXT NOT NULL,
  reward_points INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для отслеживания выполненных заданий пользователями
CREATE TABLE public.user_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, task_id)
);

-- Добавляем Row Level Security для таблицы заданий
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Политика для просмотра заданий (все авторизованные пользователи могут видеть активные задания)
CREATE POLICY "Users can view active tasks" 
  ON public.tasks 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

-- Политика для админов (только TrickMaster может создавать/редактировать задания)
CREATE POLICY "Admin can manage tasks" 
  ON public.tasks 
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (username = 'TrickMaster' OR telegram_username = 'TrickMaster')
    )
  );

-- Добавляем RLS для таблицы выполненных заданий
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свои выполненные задания
CREATE POLICY "Users can view their own completed tasks" 
  ON public.user_tasks 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Пользователи могут добавлять записи о выполнении заданий только для себя
CREATE POLICY "Users can complete tasks for themselves" 
  ON public.user_tasks 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Админы могут видеть все выполненные задания
CREATE POLICY "Admin can view all completed tasks" 
  ON public.user_tasks 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (username = 'TrickMaster' OR telegram_username = 'TrickMaster')
    )
  );

-- Создаем функцию для выполнения задания и начисления баллов
CREATE OR REPLACE FUNCTION public.complete_task(p_task_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid;
  v_task tasks%ROWTYPE;
  v_already_completed boolean;
BEGIN
  -- Получаем ID текущего пользователя
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Получаем информацию о задании
  SELECT * INTO v_task 
  FROM public.tasks 
  WHERE id = p_task_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Task not found or inactive');
  END IF;
  
  -- Проверяем, не выполнил ли уже пользователь это задание
  SELECT EXISTS (
    SELECT 1 FROM public.user_tasks 
    WHERE user_id = v_user_id AND task_id = p_task_id
  ) INTO v_already_completed;
  
  IF v_already_completed THEN
    RETURN json_build_object('success', false, 'error', 'Task already completed');
  END IF;
  
  -- Начисляем баллы пользователю
  PERFORM public.update_user_points(
    v_user_id, 
    v_task.reward_points, 
    'Выполнение задания: ' || v_task.title
  );
  
  -- Записываем выполнение задания
  INSERT INTO public.user_tasks (user_id, task_id, points_awarded)
  VALUES (v_user_id, p_task_id, v_task.reward_points);
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Task completed successfully',
    'points_awarded', v_task.reward_points
  );
END;
$function$;
