
-- Создаем таблицу турниров
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prize_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'upcoming')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  participants_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу видео турниров
CREATE TABLE public.tournament_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  views INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Добавляем RLS политики для турниров
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_videos ENABLE ROW LEVEL SECURITY;

-- Политики для турниров (все могут читать, только админы создавать)
CREATE POLICY "Everyone can view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Only authenticated users can create tournaments" ON public.tournaments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Only authenticated users can update tournaments" ON public.tournaments FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Политики для видео турниров
CREATE POLICY "Everyone can view tournament videos" ON public.tournament_videos FOR SELECT USING (true);
CREATE POLICY "Users can create their own tournament videos" ON public.tournament_videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tournament videos" ON public.tournament_videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tournament videos" ON public.tournament_videos FOR DELETE USING (auth.uid() = user_id);
