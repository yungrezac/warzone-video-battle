
-- Добавляем недостающую колонку comments_count в таблицу videos
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- Обновляем существующие записи, если колонка была добавлена
UPDATE public.videos 
SET comments_count = (
  SELECT COUNT(*) 
  FROM public.video_comments 
  WHERE video_comments.video_id = videos.id
) 
WHERE comments_count IS NULL;
