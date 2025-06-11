
-- Создаем таблицу подписок
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_type text NOT NULL DEFAULT 'premium',
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'expired', 'cancelled')),
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  telegram_payment_charge_id text,
  telegram_invoice_payload text,
  amount_stars integer NOT NULL DEFAULT 300,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Создаем таблицу платежей
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  telegram_payment_charge_id text UNIQUE NOT NULL,
  telegram_invoice_payload text NOT NULL,
  amount_stars integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Добавляем поле is_premium в profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_expires_at timestamp with time zone;

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_telegram_charge_id ON public.payments(telegram_payment_charge_id);

-- Создаем функцию для проверки активной подписки
CREATE OR REPLACE FUNCTION public.check_active_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_active_sub boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = p_user_id 
    AND status = 'active' 
    AND expires_at > now()
  ) INTO has_active_sub;
  
  RETURN has_active_sub;
END;
$$;

-- Создаем функцию для создания подписки после успешного платежа
CREATE OR REPLACE FUNCTION public.create_subscription_after_payment(
  p_user_id uuid,
  p_telegram_charge_id text,
  p_invoice_payload text,
  p_amount_stars integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_id uuid;
  v_expires_at timestamp with time zone;
BEGIN
  -- Проверяем, не обработан ли уже этот платеж
  IF EXISTS (
    SELECT 1 FROM public.payments 
    WHERE telegram_payment_charge_id = p_telegram_charge_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Payment already processed');
  END IF;
  
  -- Вычисляем дату окончания подписки (30 дней)
  v_expires_at := now() + interval '30 days';
  
  -- Создаем подписку
  INSERT INTO public.subscriptions (
    user_id, 
    subscription_type, 
    status, 
    expires_at, 
    telegram_payment_charge_id, 
    telegram_invoice_payload, 
    amount_stars
  ) VALUES (
    p_user_id, 
    'premium', 
    'active', 
    v_expires_at, 
    p_telegram_charge_id, 
    p_invoice_payload, 
    p_amount_stars
  ) RETURNING id INTO v_subscription_id;
  
  -- Записываем платеж
  INSERT INTO public.payments (
    user_id,
    subscription_id,
    telegram_payment_charge_id,
    telegram_invoice_payload,
    amount_stars,
    status,
    processed_at
  ) VALUES (
    p_user_id,
    v_subscription_id,
    p_telegram_charge_id,
    p_invoice_payload,
    p_amount_stars,
    'succeeded',
    now()
  );
  
  -- Обновляем профиль пользователя
  UPDATE public.profiles 
  SET 
    is_premium = true,
    premium_expires_at = v_expires_at
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'success', true, 
    'subscription_id', v_subscription_id,
    'expires_at', v_expires_at
  );
END;
$$;

-- Политики RLS для новых таблиц
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свои подписки
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Пользователи могут видеть только свои платежи
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Только система может создавать подписки и платежи
CREATE POLICY "System can manage subscriptions" ON public.subscriptions
  FOR ALL USING (true);

CREATE POLICY "System can manage payments" ON public.payments
  FOR ALL USING (true);
