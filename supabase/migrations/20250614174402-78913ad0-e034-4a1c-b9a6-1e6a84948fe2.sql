
-- Удаляем старый, некорректный внешний ключ
ALTER TABLE public.video_comment_likes
DROP CONSTRAINT IF EXISTS video_comment_likes_user_id_fkey;

-- Добавляем новый, корректный внешний ключ, который ссылается на таблицу профилей
ALTER TABLE public.video_comment_likes
ADD CONSTRAINT video_comment_likes_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
