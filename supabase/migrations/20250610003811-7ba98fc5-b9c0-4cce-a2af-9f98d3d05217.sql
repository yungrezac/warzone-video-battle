
-- Создаем таблицу для истории баллов
CREATE TABLE public.points_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  points_change INTEGER NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('earned', 'spent', 'withdrawal', 'refund')),
  description TEXT NOT NULL,
  reference_id UUID NULL, -- для связи с заявками на вывод, покупками и т.д.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для настроек уведомлений
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  likes_notifications BOOLEAN NOT NULL DEFAULT true,
  comments_notifications BOOLEAN NOT NULL DEFAULT true,
  winners_notifications BOOLEAN NOT NULL DEFAULT true,
  system_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для заявок на вывод средств
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount_points INTEGER NOT NULL,
  amount_rubles NUMERIC(10,2) NOT NULL,
  phone_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comment TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Создаем таблицу для заявок на покупки в магазине
CREATE TABLE public.purchase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  item_id UUID REFERENCES public.market_items NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_cost INTEGER NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_name TEXT NOT NULL,
  delivery_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comment TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Создаем таблицу для постов
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  spot_id UUID REFERENCES public.spots NULL,
  route_id UUID REFERENCES public.routes NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для лайков постов
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  post_id UUID REFERENCES public.posts NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Создаем таблицу для комментариев к постам
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  post_id UUID REFERENCES public.posts NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для комментариев к спотам
CREATE TABLE public.spot_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  spot_id UUID REFERENCES public.spots NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для лайков спотов
CREATE TABLE public.spot_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  spot_id UUID REFERENCES public.spots NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, spot_id)
);

-- Создаем таблицу для лайков комментариев спотов
CREATE TABLE public.spot_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  comment_id UUID REFERENCES public.spot_comments NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- Создаем таблицу для комментариев к маршрутам
CREATE TABLE public.route_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  route_id UUID REFERENCES public.routes NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для лайков маршрутов
CREATE TABLE public.route_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  route_id UUID REFERENCES public.routes NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, route_id)
);

-- Обновляем таблицу спотов
ALTER TABLE public.spots ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.spots ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.spots ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Обновляем таблицу маршрутов
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Обновляем таблицу профилей
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sport_category TEXT CHECK (sport_category IN ('Rollers', 'BMX', 'Skateboard'));

-- Включаем RLS для всех новых таблиц
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_likes ENABLE ROW LEVEL SECURITY;

-- Создаем политики RLS
-- Политики для points_history
CREATE POLICY "Users can view their own points history" ON public.points_history FOR SELECT USING (auth.uid() = user_id);

-- Политики для notification_settings
CREATE POLICY "Users can view their own notification settings" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification settings" ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notification settings" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политики для withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create withdrawal requests" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политики для purchase_requests
CREATE POLICY "Users can view their own purchase requests" ON public.purchase_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create purchase requests" ON public.purchase_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политики для posts
CREATE POLICY "Everyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Политики для post_likes
CREATE POLICY "Everyone can view post likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Политики для post_comments
CREATE POLICY "Everyone can view post comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create post comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own post comments" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own post comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- Политики для spot_comments
CREATE POLICY "Everyone can view spot comments" ON public.spot_comments FOR SELECT USING (true);
CREATE POLICY "Users can create spot comments" ON public.spot_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own spot comments" ON public.spot_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own spot comments" ON public.spot_comments FOR DELETE USING (auth.uid() = user_id);

-- Политики для spot_likes
CREATE POLICY "Everyone can view spot likes" ON public.spot_likes FOR SELECT USING (true);
CREATE POLICY "Users can like spots" ON public.spot_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike spots" ON public.spot_likes FOR DELETE USING (auth.uid() = user_id);

-- Политики для spot_comment_likes
CREATE POLICY "Everyone can view spot comment likes" ON public.spot_comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like spot comments" ON public.spot_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike spot comments" ON public.spot_comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Политики для route_comments
CREATE POLICY "Everyone can view route comments" ON public.route_comments FOR SELECT USING (true);
CREATE POLICY "Users can create route comments" ON public.route_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own route comments" ON public.route_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own route comments" ON public.route_comments FOR DELETE USING (auth.uid() = user_id);

-- Политики для route_likes
CREATE POLICY "Everyone can view route likes" ON public.route_likes FOR SELECT USING (true);
CREATE POLICY "Users can like routes" ON public.route_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike routes" ON public.route_likes FOR DELETE USING (auth.uid() = user_id);

-- Создаем функцию для создания записи в истории баллов
CREATE OR REPLACE FUNCTION public.create_points_history(
  p_user_id uuid,
  p_points_change integer,
  p_operation_type text,
  p_description text,
  p_reference_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.points_history (user_id, points_change, operation_type, description, reference_id)
  VALUES (p_user_id, p_points_change, p_operation_type, p_description, p_reference_id);
END;
$$;

-- Обновляем функцию update_user_points для создания записи в истории
CREATE OR REPLACE FUNCTION public.update_user_points(p_user_id uuid, p_points_change integer, p_description text DEFAULT 'Изменение баллов')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Обновляем или создаем запись с баллами пользователя
  INSERT INTO public.user_points (user_id, total_points)
  VALUES (p_user_id, p_points_change)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_points = COALESCE(user_points.total_points, 0) + p_points_change,
    updated_at = now();
    
  -- Создаем запись в истории
  INSERT INTO public.points_history (user_id, points_change, operation_type, description)
  VALUES (
    p_user_id, 
    p_points_change, 
    CASE WHEN p_points_change > 0 THEN 'earned' ELSE 'spent' END,
    p_description
  );
END;
$$;
