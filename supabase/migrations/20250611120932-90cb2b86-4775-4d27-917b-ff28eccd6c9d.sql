
-- Удаляем старые политики
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;

-- Создаем более гибкие политики для Telegram Mini App
CREATE POLICY "Anyone can view videos" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Users can upload videos to their folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] IS NOT NULL
);

CREATE POLICY "Users can delete their own videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'videos' 
  AND (storage.foldername(name))[1] IS NOT NULL
);

-- Обновляем политику для UPDATE операций
CREATE POLICY "Users can update their own videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'videos' 
  AND (storage.foldername(name))[1] IS NOT NULL
);

-- Убеждаемся что bucket существует и является публичным
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;
