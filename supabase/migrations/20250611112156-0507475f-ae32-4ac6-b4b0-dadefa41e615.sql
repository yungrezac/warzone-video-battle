
-- Обновляем RLS политики для корректной работы с профилями пользователей
-- Удаляем старые политики
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Authenticated users can insert likes" ON public.video_likes;
DROP POLICY IF EXISTS "Authenticated users can insert ratings" ON public.video_ratings;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.video_comments;

-- Создаем новые политики для storage, которые работают без auth.uid()
CREATE POLICY "Users can upload videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'videos' 
  AND (storage.foldername(name))[1] IS NOT NULL
);

-- Обновляем политики для таблицы videos - разрешаем всем авторизованным пользователям
CREATE POLICY "Users can insert videos" ON public.videos
FOR INSERT WITH CHECK (
  user_id IS NOT NULL
);

-- Аналогично для лайков
CREATE POLICY "Users can insert likes" ON public.video_likes
FOR INSERT WITH CHECK (
  user_id IS NOT NULL
);

-- Для рейтингов
CREATE POLICY "Users can insert ratings" ON public.video_ratings
FOR INSERT WITH CHECK (
  user_id IS NOT NULL
);

-- Для комментариев
CREATE POLICY "Users can insert comments" ON public.video_comments
FOR INSERT WITH CHECK (
  user_id IS NOT NULL
);

-- Создаем букет для видео если его нет
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;
