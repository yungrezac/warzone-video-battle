
-- Добавляем политики для user_market_items

-- Политика для создания товаров (только премиум пользователи)
CREATE POLICY "Premium users can create user market items" ON public.user_market_items
FOR INSERT
WITH CHECK (
  public.is_current_user_premium() = true
);

-- Политика для обновления товаров (только создатель)
CREATE POLICY "Users can update their own market items" ON public.user_market_items
FOR UPDATE
USING (user_id = auth.uid());

-- Политика для удаления товаров (только создатель)
CREATE POLICY "Users can delete their own market items" ON public.user_market_items
FOR DELETE
USING (user_id = auth.uid());
