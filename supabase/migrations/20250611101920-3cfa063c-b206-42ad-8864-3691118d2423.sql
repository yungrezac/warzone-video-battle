
-- Обновляем RLS политики для videos bucket в storage
DROP POLICY IF EXISTS "Anyone can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;

-- Создаем правильные политики для storage
CREATE POLICY "Authenticated users can upload videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'videos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view videos" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Users can delete their own videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Обновляем политики для таблицы videos
DROP POLICY IF EXISTS "Anyone can view videos" ON public.videos;
DROP POLICY IF EXISTS "Users can insert their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can delete their own videos" ON public.videos;

-- Создаем оптимизированные политики для videos
CREATE POLICY "Anyone can view videos" ON public.videos
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert videos" ON public.videos
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Users can update their own videos" ON public.videos
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON public.videos
FOR DELETE USING (auth.uid() = user_id);

-- Добавляем индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category ON public.videos(category);
CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON public.video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON public.video_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_video_ratings_video_id ON public.video_ratings(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON public.video_comments(video_id);

-- Обновляем политики для связанных таблиц
DROP POLICY IF EXISTS "Anyone can view video likes" ON public.video_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.video_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.video_likes;

CREATE POLICY "Anyone can view video likes" ON public.video_likes
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert likes" ON public.video_likes
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Users can delete their own likes" ON public.video_likes
FOR DELETE USING (auth.uid() = user_id);

-- Аналогично для рейтингов
DROP POLICY IF EXISTS "Anyone can view video ratings" ON public.video_ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.video_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.video_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.video_ratings;

CREATE POLICY "Anyone can view video ratings" ON public.video_ratings
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert ratings" ON public.video_ratings
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Users can update their own ratings" ON public.video_ratings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON public.video_ratings
FOR DELETE USING (auth.uid() = user_id);

-- И для комментариев
DROP POLICY IF EXISTS "Anyone can view video comments" ON public.video_comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.video_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.video_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.video_comments;

CREATE POLICY "Anyone can view video comments" ON public.video_comments
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON public.video_comments
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Users can update their own comments" ON public.video_comments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.video_comments
FOR DELETE USING (auth.uid() = user_id);
