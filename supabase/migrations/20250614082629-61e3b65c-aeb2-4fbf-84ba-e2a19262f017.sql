
-- Создаем функцию для начисления баллов за различные действия
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
END;
$$;

-- Функция для начисления баллов за загрузку видео
CREATE OR REPLACE FUNCTION public.award_video_upload_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Начисляем 100 баллов за загрузку видео
  PERFORM public.award_points_for_action(
    NEW.user_id,
    'video_upload',
    100,
    'Загрузка видео: ' || NEW.title,
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Функция для начисления баллов за лайки к видео
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

-- Функция для начисления баллов за комментарии к видео
CREATE OR REPLACE FUNCTION public.award_comment_points()
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
    
    -- Начисляем 2 балла владельцу видео за полученный комментарий
    PERFORM public.award_points_for_action(
      video_owner_id,
      'comment_received',
      2,
      'Получен комментарий на видео: ' || video_title,
      NEW.video_id
    );
    
    -- Начисляем 2 балла тому кто написал комментарий
    PERFORM public.award_points_for_action(
      NEW.user_id,
      'comment_given',
      2,
      'Написан комментарий к видео: ' || video_title,
      NEW.video_id
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- При удалении комментария забираем баллы
    SELECT user_id, title INTO video_owner_id, video_title
    FROM public.videos 
    WHERE id = OLD.video_id;
    
    -- Забираем баллы у владельца видео
    PERFORM public.award_points_for_action(
      video_owner_id,
      'comment_removed',
      -2,
      'Удален комментарий с видео: ' || video_title,
      OLD.video_id
    );
    
    -- Забираем баллы у того кто удалил комментарий
    PERFORM public.award_points_for_action(
      OLD.user_id,
      'comment_removed',
      -2,
      'Удален комментарий к видео: ' || video_title,
      OLD.video_id
    );
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Функция для начисления баллов за просмотры
CREATE OR REPLACE FUNCTION public.award_view_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Начисляем 1 балл за каждый просмотр при обновлении счетчика просмотров
  IF OLD.views IS DISTINCT FROM NEW.views AND NEW.views > OLD.views THEN
    PERFORM public.award_points_for_action(
      NEW.user_id,
      'view_received',
      NEW.views - OLD.views,
      'Получены просмотры на видео: ' || NEW.title,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создаем триггеры
DROP TRIGGER IF EXISTS video_upload_points_trigger ON public.videos;
CREATE TRIGGER video_upload_points_trigger
  AFTER INSERT ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.award_video_upload_points();

DROP TRIGGER IF EXISTS video_like_points_trigger ON public.video_likes;
CREATE TRIGGER video_like_points_trigger
  AFTER INSERT OR DELETE ON public.video_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_like_points();

DROP TRIGGER IF EXISTS video_comment_points_trigger ON public.video_comments;
CREATE TRIGGER video_comment_points_trigger
  AFTER INSERT OR DELETE ON public.video_comments
  FOR EACH ROW EXECUTE FUNCTION public.award_comment_points();

DROP TRIGGER IF EXISTS video_view_points_trigger ON public.videos;
CREATE TRIGGER video_view_points_trigger
  AFTER UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.award_view_points();
