
-- Исправляем ограничения в таблице points_history
-- Сначала проверим текущие ограничения
DO $$
BEGIN
    -- Удаляем старые ограничения если они существуют
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'points_history_operation_type_check'
    ) THEN
        ALTER TABLE public.points_history DROP CONSTRAINT points_history_operation_type_check;
    END IF;
END $$;

-- Добавляем правильное ограничение для operation_type
ALTER TABLE public.points_history 
ADD CONSTRAINT points_history_operation_type_check 
CHECK (operation_type IN (
    'video_upload', 
    'like_received', 
    'like_given', 
    'like_removed',
    'comment_received', 
    'comment_given', 
    'comment_removed',
    'view_received'
));

-- Обновляем функции для корректной работы с типами операций
CREATE OR REPLACE FUNCTION public.award_like_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  video_owner_id uuid;
  video_title text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Получаем владельца видео
    SELECT user_id, title INTO video_owner_id, video_title
    FROM public.videos 
    WHERE id = NEW.video_id;
    
    -- Начисляем 3 балла владельцу видео за полученный лайк
    PERFORM public.award_points_for_action(
      video_owner_id,
      'like_received',
      3,
      'Получен лайк на видео: ' || video_title,
      NEW.video_id
    );
    
    -- Начисляем 3 балла тому кто поставил лайк
    PERFORM public.award_points_for_action(
      NEW.user_id,
      'like_given',
      3,
      'Поставлен лайк на видео: ' || video_title,
      NEW.video_id
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- При удалении лайка забираем баллы
    SELECT user_id, title INTO video_owner_id, video_title
    FROM public.videos 
    WHERE id = OLD.video_id;
    
    -- Забираем баллы у владельца видео
    PERFORM public.award_points_for_action(
      video_owner_id,
      'like_removed',
      -3,
      'Убран лайк с видео: ' || video_title,
      OLD.video_id
    );
    
    -- Забираем баллы у того кто убрал лайк
    PERFORM public.award_points_for_action(
      OLD.user_id,
      'like_removed',
      -3,
      'Убран лайк с видео: ' || video_title,
      OLD.video_id
    );
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;
