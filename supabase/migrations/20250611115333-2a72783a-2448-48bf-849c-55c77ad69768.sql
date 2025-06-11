
-- Удаляем старый внешний ключ, который ссылается на auth.users
ALTER TABLE public.notification_settings 
DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;

-- Удаляем также внешний ключ из предыдущей миграции, если он существует
ALTER TABLE public.notification_settings 
DROP CONSTRAINT IF EXISTS fk_notification_settings_user_id;

-- Добавляем правильный внешний ключ, который ссылается на profiles
ALTER TABLE public.notification_settings 
ADD CONSTRAINT fk_notification_settings_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
