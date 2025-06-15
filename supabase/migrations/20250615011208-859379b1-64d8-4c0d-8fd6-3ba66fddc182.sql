
ALTER TABLE public.notification_settings ADD COLUMN new_subscriber_notifications BOOLEAN NOT NULL DEFAULT true;
COMMENT ON COLUMN public.notification_settings.new_subscriber_notifications IS 'Включить/выключить уведомления о новых подписчиках.';
