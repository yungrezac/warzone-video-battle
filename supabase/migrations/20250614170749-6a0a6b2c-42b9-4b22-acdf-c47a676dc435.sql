
-- Разрешаем комментариям иметь родительский комментарий для создания веток (ответов)
ALTER TABLE public.video_comments
ADD COLUMN parent_comment_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE;

-- Добавляем счетчик лайков к комментариям для производительности
ALTER TABLE public.video_comments 
ADD COLUMN likes_count INT NOT NULL DEFAULT 0;

-- Создаем таблицу для хранения лайков к комментариям
CREATE TABLE public.video_comment_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES public.video_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT video_comment_likes_user_comment_unique UNIQUE (user_id, comment_id)
);

-- Включаем защиту на уровне строк для таблицы лайков
ALTER TABLE public.video_comment_likes ENABLE ROW LEVEL SECURITY;

-- Политика: все могут видеть лайки
CREATE POLICY "Allow read access to everyone for comment likes" 
ON public.video_comment_likes FOR SELECT USING (true);

-- Политика: пользователи могут ставить свои лайки
CREATE POLICY "Allow users to insert their own comment likes" 
ON public.video_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут удалять свои лайки
CREATE POLICY "Allow users to delete their own comment likes" 
ON public.video_comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Функция для автоматического обновления счетчика лайков у комментария
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.video_comments
        SET likes_count = likes_count + 1
        WHERE id = NEW.comment_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.video_comments
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер, который вызывает функцию при добавлении или удалении лайка
CREATE TRIGGER on_video_comment_like
AFTER INSERT OR DELETE ON public.video_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

