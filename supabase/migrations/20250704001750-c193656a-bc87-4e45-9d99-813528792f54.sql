-- Обновляем таблицу video_battles для поддержки текущего участника и дедлайна
ALTER TABLE public.video_battles 
ADD COLUMN IF NOT EXISTS current_participant_id UUID REFERENCES public.battle_participants(id),
ADD COLUMN IF NOT EXISTS current_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_video_sequence INTEGER DEFAULT 1;

-- Функция для выбора следующего участника
CREATE OR REPLACE FUNCTION public.select_next_battle_participant(battle_id_param UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  next_participant_id UUID;
BEGIN
  -- Выбираем случайного активного участника
  SELECT id INTO next_participant_id
  FROM public.battle_participants 
  WHERE battle_id = battle_id_param 
    AND status = 'active'
  ORDER BY RANDOM()
  LIMIT 1;
  
  IF next_participant_id IS NOT NULL THEN
    -- Обновляем текущего участника и дедлайн
    UPDATE public.video_battles 
    SET current_participant_id = next_participant_id,
        current_deadline = now() + (time_limit_minutes || ' minutes')::INTERVAL,
        updated_at = now()
    WHERE id = battle_id_param;
  END IF;
  
  RETURN next_participant_id;
END;
$$;

-- Функция для добавления буквы FULL участнику
CREATE OR REPLACE FUNCTION public.add_full_letter_to_participant(participant_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  current_letters TEXT;
  new_letters TEXT;
  full_word TEXT := 'FULL';
BEGIN
  -- Получаем текущие буквы участника
  SELECT full_letters INTO current_letters
  FROM public.battle_participants 
  WHERE id = participant_id_param;
  
  -- Добавляем следующую букву
  new_letters := current_letters || SUBSTRING(full_word, LENGTH(current_letters) + 1, 1);
  
  UPDATE public.battle_participants 
  SET full_letters = new_letters,
      updated_at = now()
  WHERE id = participant_id_param;
  
  -- Если слово собрано полностью, исключаем участника
  IF LENGTH(new_letters) = 4 THEN
    UPDATE public.battle_participants 
    SET status = 'eliminated',
        eliminated_at = now()
    WHERE id = participant_id_param;
  END IF;
  
  RETURN new_letters;
END;
$$;

-- Функция для определения победителя батла
CREATE OR REPLACE FUNCTION public.check_battle_winner(battle_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  active_count INTEGER;
  winner_participant RECORD;
BEGIN
  -- Считаем активных участников
  SELECT COUNT(*) INTO active_count
  FROM public.battle_participants 
  WHERE battle_id = battle_id_param AND status = 'active';
  
  IF active_count = 1 THEN
    -- Получаем данные победителя
    SELECT bp.*, p.username, p.first_name 
    INTO winner_participant
    FROM public.battle_participants bp
    JOIN public.profiles p ON bp.user_id = p.id
    WHERE bp.battle_id = battle_id_param AND bp.status = 'active';
    
    -- Обновляем статус батла и победителя
    UPDATE public.video_battles 
    SET status = 'completed',
        winner_id = winner_participant.user_id,
        current_participant_id = NULL,
        current_deadline = NULL,
        updated_at = now()
    WHERE id = battle_id_param;
    
    -- Создаем кубок для победителя
    INSERT INTO public.battle_trophies (
      user_id, 
      battle_id, 
      battle_title, 
      battle_date, 
      points_awarded
    ) 
    SELECT 
      winner_participant.user_id,
      battle_id_param,
      vb.title,
      vb.start_time::DATE,
      vb.prize_points
    FROM public.video_battles vb
    WHERE vb.id = battle_id_param;
    
    -- Начисляем баллы победителю
    PERFORM public.award_points_for_action(
      winner_participant.user_id,
      'battle_winner',
      (SELECT prize_points FROM public.video_battles WHERE id = battle_id_param),
      'Победа в батле: ' || (SELECT title FROM public.video_battles WHERE id = battle_id_param),
      battle_id_param
    );
  END IF;
END;
$$;