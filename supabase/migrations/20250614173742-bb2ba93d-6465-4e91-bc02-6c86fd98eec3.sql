
-- Удаляем старые политики, если они существуют, чтобы избежать конфликтов.
DROP POLICY IF EXISTS "Allow read access to everyone for comment likes" ON public.video_comment_likes;
DROP POLICY IF EXISTS "Allow users to insert their own comment likes" ON public.video_comment_likes;
DROP POLICY IF EXISTS "Allow users to delete their own comment likes" ON public.video_comment_likes;

-- Убедимся, что RLS для таблицы включен.
ALTER TABLE public.video_comment_likes ENABLE ROW LEVEL SECURITY;

-- Создаем новые, правильные политики.

-- Политика: Любой может просматривать лайки.
CREATE POLICY "Allow read access to everyone for comment likes"
ON public.video_comment_likes
FOR SELECT USING (true);

-- Политика: Аутентифицированные пользователи могут вставлять лайки от своего имени.
CREATE POLICY "Allow users to insert their own comment likes"
ON public.video_comment_likes
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Политика: Аутентифицированные пользователи могут удалять свои собственные лайки.
CREATE POLICY "Allow users to delete their own comment likes"
ON public.video_comment_likes
FOR DELETE TO authenticated
USING (auth.uid() = user_id);
