
-- Создаем таблицу для хранения подписок пользователей
CREATE TABLE public.user_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscribed_to_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT user_subscriptions_unique_pair UNIQUE (subscriber_id, subscribed_to_id)
);
COMMENT ON TABLE public.user_subscriptions IS 'Хранит связи между пользователями, которые подписываются друг на друга.';

-- Включаем защиту на уровне строк
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для таблицы подписок
CREATE POLICY "Пользователи могут просматривать все подписки" ON public.user_subscriptions FOR SELECT USING (true);
CREATE POLICY "Пользователи могут создавать свои подписки" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = subscriber_id);
CREATE POLICY "Пользователи могут удалять свои подписки" ON public.user_subscriptions FOR DELETE USING (auth.uid() = subscriber_id);

-- Добавляем счетчики подписчиков и подписок в таблицу профилей для производительности
ALTER TABLE public.profiles ADD COLUMN followers_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN following_count INTEGER NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.profiles.followers_count IS 'Количество подписчиков пользователя.';
COMMENT ON COLUMN public.profiles.following_count IS 'Количество пользователей, на которых подписан пользователь.';


-- Создаем функцию для обновления счетчиков при подписке/отписке
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Увеличиваем счетчик подписчиков у пользователя, на которого подписались
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.subscribed_to_id;
    -- Увеличиваем счетчик подписок у пользователя, который подписался
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.subscriber_id;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Уменьшаем счетчик подписчиков у пользователя, от которого отписались
    UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.subscribed_to_id;
    -- Уменьшаем счетчик подписок у пользователя, который отписался
    UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.subscriber_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер, который будет вызывать функцию при изменении подписок
CREATE TRIGGER on_follow_change
AFTER INSERT OR DELETE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- Добавляем новую настройку уведомлений
ALTER TABLE public.notification_settings ADD COLUMN new_video_notifications BOOLEAN NOT NULL DEFAULT true;
COMMENT ON COLUMN public.notification_settings.new_video_notifications IS 'Включить/выключить уведомления о новых видео от пользователей из подписок.';

