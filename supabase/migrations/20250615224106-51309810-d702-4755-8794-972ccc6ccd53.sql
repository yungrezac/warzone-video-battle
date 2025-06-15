
-- Проверяем текущие политики для tournament_participants
-- и создаем правильные политики для присоединения к турниру

-- Удаляем существующие политики если они есть
DROP POLICY IF EXISTS "Users can join tournaments" ON public.tournament_participants;
DROP POLICY IF EXISTS "Everyone can view tournament participants" ON public.tournament_participants;

-- Создаем политику для просмотра участников турнира
CREATE POLICY "Everyone can view tournament participants" 
  ON public.tournament_participants 
  FOR SELECT 
  USING (true);

-- Создаем политику для присоединения к турниру
CREATE POLICY "Authenticated users can join tournaments" 
  ON public.tournament_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Также убеждаемся, что у пользователей есть права на обновление своих записей
CREATE POLICY "Users can update their tournament participation" 
  ON public.tournament_participants 
  FOR UPDATE 
  USING (auth.uid() = user_id);
