
-- Создаем таблицу для видеобатлов
CREATE TABLE public.video_battles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  reference_video_url text NOT NULL,
  reference_video_title text NOT NULL,
  start_time timestamp with time zone NOT NULL,
  time_limit_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'registration' CHECK (status IN ('registration', 'active', 'completed', 'cancelled')),
  current_participant_id uuid,
  current_deadline timestamp with time zone,
  winner_id uuid,
  prize_points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Создаем таблицу для участников батла
CREATE TABLE public.battle_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id uuid NOT NULL REFERENCES public.video_battles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'eliminated', 'winner')),
  full_letters text NOT NULL DEFAULT '',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  eliminated_at timestamp with time zone,
  UNIQUE(battle_id, user_id)
);

-- Создаем таблицу для судей батла
CREATE TABLE public.battle_judges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id uuid NOT NULL REFERENCES public.video_battles(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(battle_id, judge_id)
);

-- Создаем таблицу для видео в батле
CREATE TABLE public.battle_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id uuid NOT NULL REFERENCES public.video_battles(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.battle_participants(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  title text NOT NULL,
  is_reference boolean NOT NULL DEFAULT false,
  is_approved boolean,
  approved_by uuid,
  approved_at timestamp with time zone,
  sequence_number integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Создаем таблицу для кубков победителей
CREATE TABLE public.battle_trophies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  battle_id uuid NOT NULL REFERENCES public.video_battles(id) ON DELETE CASCADE,
  battle_title text NOT NULL,
  battle_date date NOT NULL,
  points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Включаем RLS для всех таблиц
ALTER TABLE public.video_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_trophies ENABLE ROW LEVEL SECURITY;

-- Политики RLS для video_battles
CREATE POLICY "Everyone can view video battles" 
  ON public.video_battles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only organizer can create battles" 
  ON public.video_battles 
  FOR INSERT 
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Only organizer can update battles" 
  ON public.video_battles 
  FOR UPDATE 
  USING (organizer_id = auth.uid());

-- Политики для battle_participants
CREATE POLICY "Everyone can view battle participants" 
  ON public.battle_participants 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can join battles" 
  ON public.battle_participants 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Политики для battle_judges
CREATE POLICY "Everyone can view battle judges" 
  ON public.battle_judges 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only organizer can add judges" 
  ON public.battle_judges 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.video_battles 
    WHERE id = battle_id AND organizer_id = auth.uid()
  ));

-- Политики для battle_videos
CREATE POLICY "Everyone can view battle videos" 
  ON public.battle_videos 
  FOR SELECT 
  USING (true);

CREATE POLICY "Participants can upload their videos" 
  ON public.battle_videos 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.battle_participants 
    WHERE id = participant_id AND user_id = auth.uid()
  ));

CREATE POLICY "Judges can approve videos" 
  ON public.battle_videos 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.battle_judges 
    WHERE battle_id = battle_videos.battle_id AND judge_id = auth.uid()
  ));

-- Политики для battle_trophies
CREATE POLICY "Users can view their own trophies" 
  ON public.battle_trophies 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Everyone can view all trophies" 
  ON public.battle_trophies 
  FOR SELECT 
  USING (true);

-- Функция для обновления статуса батла
CREATE OR REPLACE FUNCTION update_battle_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновляем статус батла на active когда наступает время начала
  UPDATE public.video_battles 
  SET status = 'active',
      updated_at = now()
  WHERE id = NEW.battle_id 
    AND status = 'registration' 
    AND start_time <= now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функция для случайного выбора следующего участника
CREATE OR REPLACE FUNCTION select_next_participant(battle_id_param uuid)
RETURNS uuid AS $$
DECLARE
  next_participant_id uuid;
BEGIN
  -- Выбираем случайного активного участника
  SELECT bp.user_id INTO next_participant_id
  FROM public.battle_participants bp
  WHERE bp.battle_id = battle_id_param 
    AND bp.status = 'active'
  ORDER BY RANDOM()
  LIMIT 1;
  
  -- Обновляем текущего участника и дедлайн
  UPDATE public.video_battles 
  SET current_participant_id = next_participant_id,
      current_deadline = now() + interval '30 minutes',
      updated_at = now()
  WHERE id = battle_id_param;
  
  RETURN next_participant_id;
END;
$$ LANGUAGE plpgsql;

-- Функция для добавления буквы FULL при неправильном видео
CREATE OR REPLACE FUNCTION add_full_letter(participant_id_param uuid)
RETURNS void AS $$
DECLARE
  current_letters text;
  full_word text := 'FULL';
BEGIN
  -- Получаем текущие буквы участника
  SELECT full_letters INTO current_letters
  FROM public.battle_participants 
  WHERE id = participant_id_param;
  
  -- Добавляем следующую букву
  IF length(current_letters) < 4 THEN
    UPDATE public.battle_participants 
    SET full_letters = current_letters || substring(full_word, length(current_letters) + 1, 1),
        updated_at = now()
    WHERE id = participant_id_param;
    
    -- Если слово собрано полностью, исключаем участника
    IF length(current_letters) = 3 THEN
      UPDATE public.battle_participants 
      SET status = 'eliminated',
          eliminated_at = now()
      WHERE id = participant_id_param;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Функция для определения победителя
CREATE OR REPLACE FUNCTION determine_battle_winner(battle_id_param uuid)
RETURNS void AS $$
DECLARE
  winner_user_id uuid;
  battle_info RECORD;
BEGIN
  -- Проверяем, остался ли только один активный участник
  SELECT COUNT(*) as active_count INTO battle_info
  FROM public.battle_participants 
  WHERE battle_id = battle_id_param AND status = 'active';
  
  IF battle_info.active_count = 1 THEN
    -- Получаем ID победителя
    SELECT user_id INTO winner_user_id
    FROM public.battle_participants 
    WHERE battle_id = battle_id_param AND status = 'active';
    
    -- Обновляем статус батла и победителя
    UPDATE public.video_battles 
    SET status = 'completed',
        winner_id = winner_user_id,
        updated_at = now()
    WHERE id = battle_id_param;
    
    -- Обновляем статус участника на winner
    UPDATE public.battle_participants 
    SET status = 'winner'
    WHERE battle_id = battle_id_param AND user_id = winner_user_id;
    
    -- Получаем информацию о батле для создания кубка
    SELECT title, start_time::date as battle_date, prize_points 
    INTO battle_info
    FROM public.video_battles 
    WHERE id = battle_id_param;
    
    -- Создаем кубок для победителя
    INSERT INTO public.battle_trophies (
      user_id, 
      battle_id, 
      battle_title, 
      battle_date, 
      points_awarded
    ) VALUES (
      winner_user_id,
      battle_id_param,
      battle_info.title,
      battle_info.battle_date,
      battle_info.prize_points
    );
    
    -- Начисляем баллы победителю
    PERFORM public.award_points_for_action(
      winner_user_id,
      'battle_winner',
      battle_info.prize_points,
      'Победа в батле: ' || battle_info.title,
      battle_id_param
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
