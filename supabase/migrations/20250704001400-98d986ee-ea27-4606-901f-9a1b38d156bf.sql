-- Включаем realtime для таблиц батлов
ALTER TABLE public.video_battles REPLICA IDENTITY FULL;
ALTER TABLE public.battle_participants REPLICA IDENTITY FULL;

-- Добавляем таблицы к публикации realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_battles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_participants;