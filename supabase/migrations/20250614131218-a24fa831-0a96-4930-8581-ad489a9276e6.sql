
UPDATE public.profiles
SET 
  is_premium = true,
  premium_expires_at = '2999-12-31 23:59:59+00'
WHERE telegram_id = '5042988950';
