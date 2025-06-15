
-- Создаем таблицу для онлайн турниров
CREATE TABLE public.online_tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  banner_url text NOT NULL,
  entry_cost_points integer NOT NULL DEFAULT 0,
  min_participants integer NOT NULL DEFAULT 2,
  end_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'registration' CHECK (status IN ('registration', 'active', 'completed')),
  winner_id uuid,
  participants_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Создаем таблицу для участников турнира
CREATE TABLE public.tournament_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES public.online_tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  video_id uuid REFERENCES public.tournament_videos(id),
  UNIQUE(tournament_id, user_id)
);

-- Создаем таблицу для судей турнира
CREATE TABLE public.tournament_judges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES public.online_tournaments(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, judge_id)
);

-- Создаем таблицу для оценок судей
CREATE TABLE public.tournament_video_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES public.online_tournaments(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.tournament_videos(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, video_id, judge_id)
);

-- Включаем RLS для всех таблиц
ALTER TABLE public.online_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_video_ratings ENABLE ROW LEVEL SECURITY;

-- Политики RLS для online_tournaments
CREATE POLICY "Everyone can view online tournaments" 
  ON public.online_tournaments 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only specific user can create tournaments" 
  ON public.online_tournaments 
  FOR INSERT 
  WITH CHECK (creator_id = '649d5b0d-88f6-49fb-85dc-a88d6cba1327'::uuid);

CREATE POLICY "Only creator can update tournaments" 
  ON public.online_tournaments 
  FOR UPDATE 
  USING (creator_id = '649d5b0d-88f6-49fb-85dc-a88d6cba1327'::uuid);

-- Политики для tournament_participants
CREATE POLICY "Everyone can view tournament participants" 
  ON public.tournament_participants 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can join tournaments" 
  ON public.tournament_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Политики для tournament_judges
CREATE POLICY "Everyone can view tournament judges" 
  ON public.tournament_judges 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only tournament creator can add judges" 
  ON public.tournament_judges 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.online_tournaments 
    WHERE id = tournament_id AND creator_id = '649d5b0d-88f6-49fb-85dc-a88d6cba1327'::uuid
  ));

-- Политики для tournament_video_ratings
CREATE POLICY "Everyone can view ratings" 
  ON public.tournament_video_ratings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only judges can rate videos" 
  ON public.tournament_video_ratings 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tournament_judges 
    WHERE tournament_id = tournament_video_ratings.tournament_id AND judge_id = auth.uid()
  ));

-- Функция для обновления счетчика участников
CREATE OR REPLACE FUNCTION update_tournament_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.online_tournaments 
    SET participants_count = participants_count + 1,
        updated_at = now()
    WHERE id = NEW.tournament_id;
    
    -- Проверяем, достигли ли минимального количества участников
    UPDATE public.online_tournaments 
    SET status = 'active',
        updated_at = now()
    WHERE id = NEW.tournament_id 
      AND status = 'registration' 
      AND participants_count >= min_participants;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.online_tournaments 
    SET participants_count = GREATEST(0, participants_count - 1),
        updated_at = now()
    WHERE id = OLD.tournament_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления счетчика участников
CREATE TRIGGER update_tournament_participants_count_trigger
  AFTER INSERT OR DELETE ON public.tournament_participants
  FOR EACH ROW EXECUTE FUNCTION update_tournament_participants_count();

-- Функция для завершения турнира и определения победителя
CREATE OR REPLACE FUNCTION complete_tournament_and_determine_winner()
RETURNS void AS $$
DECLARE
  tournament_record RECORD;
  winner_video_id uuid;
  winner_user_id uuid;
BEGIN
  -- Находим турниры которые должны быть завершены
  FOR tournament_record IN 
    SELECT id FROM public.online_tournaments 
    WHERE status = 'active' AND end_date <= now()
  LOOP
    -- Определяем победителя по средней оценке
    SELECT tv.id, tv.user_id INTO winner_video_id, winner_user_id
    FROM public.tournament_videos tv
    JOIN public.tournament_participants tp ON tv.id = tp.video_id
    WHERE tp.tournament_id = tournament_record.id
    GROUP BY tv.id, tv.user_id
    ORDER BY (
      SELECT AVG(rating::numeric) 
      FROM public.tournament_video_ratings 
      WHERE video_id = tv.id AND tournament_id = tournament_record.id
    ) DESC NULLS LAST
    LIMIT 1;
    
    -- Обновляем турнир со статусом завершен и победителем
    UPDATE public.online_tournaments 
    SET status = 'completed',
        winner_id = winner_user_id,
        updated_at = now()
    WHERE id = tournament_record.id;
    
    -- Отмечаем победившее видео
    UPDATE public.tournament_videos 
    SET is_winner = true 
    WHERE id = winner_video_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
