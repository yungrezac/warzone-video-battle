
-- Добавляем внешний ключ для notification_settings
ALTER TABLE notification_settings 
ADD CONSTRAINT fk_notification_settings_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Создаем индекс для быстрого поиска настроек по пользователю
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Добавляем настройки уведомлений для достижений
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS achievements_notifications boolean DEFAULT true;

-- Обновляем существующие записи, чтобы добавить колонку достижений
UPDATE notification_settings 
SET achievements_notifications = true 
WHERE achievements_notifications IS NULL;
