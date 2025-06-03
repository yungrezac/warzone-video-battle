
-- Включаем RLS для всех таблиц
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы videos
CREATE POLICY "Anyone can view videos" ON public.videos
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own videos" ON public.videos
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own videos" ON public.videos
FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own videos" ON public.videos
FOR DELETE USING (true);

-- Политики для таблицы video_likes
CREATE POLICY "Anyone can view video likes" ON public.video_likes
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON public.video_likes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own likes" ON public.video_likes
FOR DELETE USING (true);

-- Политики для таблицы video_ratings
CREATE POLICY "Anyone can view video ratings" ON public.video_ratings
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own ratings" ON public.video_ratings
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own ratings" ON public.video_ratings
FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own ratings" ON public.video_ratings
FOR DELETE USING (true);

-- Политики для таблицы video_comments
CREATE POLICY "Anyone can view video comments" ON public.video_comments
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON public.video_comments
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own comments" ON public.video_comments
FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own comments" ON public.video_comments
FOR DELETE USING (true);

-- Политики для таблицы user_points
CREATE POLICY "Users can view all points" ON public.user_points
FOR SELECT USING (true);

CREATE POLICY "System can insert points" ON public.user_points
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update points" ON public.user_points
FOR UPDATE USING (true);

-- Создаем bucket для видео если его нет
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Политики для storage bucket videos
CREATE POLICY "Anyone can upload videos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Anyone can view videos" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Users can delete their own videos" ON storage.objects
FOR DELETE USING (bucket_id = 'videos');
