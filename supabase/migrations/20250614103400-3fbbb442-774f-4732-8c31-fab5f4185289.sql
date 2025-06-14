
-- Удаляем таблицу video_ratings
DROP TABLE IF EXISTS public.video_ratings;

-- Возможно, существуют какие-либо функции или триггеры, связанные с video_ratings.
-- Если бы они были, их также нужно было бы удалить.
-- Например, если бы был триггер award_rating_points:
-- DROP TRIGGER IF EXISTS award_rating_points_trigger ON public.video_ratings;
-- DROP FUNCTION IF EXISTS public.award_rating_points();
-- На данный момент, судя по предоставленной схеме, таких связанных объектов нет, кроме самой таблицы.
