
-- Предоставление вечной премиум-подписки пользователю с ID 649d5b0d-88f6-49fb-85dc-a88d6cba1327

-- Шаг 1: Обновляем профиль пользователя для установки премиум-статуса
UPDATE public.profiles
SET 
  is_premium = true,
  premium_expires_at = '2999-12-31 23:59:59+00'
WHERE id = '649d5b0d-88f6-49fb-85dc-a88d6cba1327';

-- Шаг 2: Создаем запись о подписке для консистентности данных
INSERT INTO public.subscriptions (
  user_id,
  subscription_type,
  status,
  starts_at,
  expires_at,
  telegram_payment_charge_id,
  telegram_invoice_payload,
  amount_stars
)
VALUES (
  '649d5b0d-88f6-49fb-85dc-a88d6cba1327',
  'premium',
  'active',
  now(),
  '2999-12-31 23:59:59+00',
  'manual_grant_by_admin',
  'manual_grant_for_user_649d5b0d-88f6-49fb-85dc-a88d6cba1327',
  0
);
