
-- Исправление ошибок сборки: создание таблицы video_ratings
CREATE TABLE IF NOT EXISTS public.video_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS video_ratings_user_video_idx ON public.video_ratings(user_id, video_id);

ALTER TABLE public.video_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ratings"
ON public.video_ratings FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own ratings"
ON public.video_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
ON public.video_ratings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
ON public.video_ratings FOR DELETE
USING (auth.uid() = user_id);

-- Обновление таблицы withdrawal_requests для вывода в USDT
ALTER TABLE public.withdrawal_requests DROP COLUMN IF EXISTS amount_rubles;
ALTER TABLE public.withdrawal_requests DROP COLUMN IF EXISTS bank_name;
ALTER TABLE public.withdrawal_requests DROP COLUMN IF EXISTS recipient_name;
ALTER TABLE public.withdrawal_requests DROP COLUMN IF EXISTS phone_number;

ALTER TABLE public.withdrawal_requests ADD COLUMN IF NOT EXISTS amount_usdt NUMERIC;
ALTER TABLE public.withdrawal_requests ADD COLUMN IF NOT EXISTS wallet_address TEXT;
