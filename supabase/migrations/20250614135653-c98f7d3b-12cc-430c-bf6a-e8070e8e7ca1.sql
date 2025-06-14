
-- Create a function to check if the currently authenticated user has an active premium subscription.
CREATE OR REPLACE FUNCTION public.is_current_user_premium()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_premium_status BOOLEAN;
BEGIN
  -- We check both is_premium flag and the expiration date from the profiles table.
  -- This is more robust than just checking the flag.
  SELECT p.is_premium AND p.premium_expires_at > now()
  INTO is_premium_status
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  RETURN COALESCE(is_premium_status, false);
END;
$$;

-- Create the table for user-listed market items for real money.
CREATE TABLE public.user_market_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_audience TEXT NOT NULL CHECK (target_audience IN ('rollers', 'bmx', 'skate')),
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    product_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true, -- For moderation purposes
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_market_items IS 'Items listed by premium users for sale with real currency.';
COMMENT ON COLUMN public.user_market_items.target_audience IS 'The primary audience for the item (e.g., rollers, bmx, skate).';
COMMENT ON COLUMN public.user_market_items.product_url IS 'External link where the item can be purchased.';
COMMENT ON COLUMN public.user_market_items.is_active IS 'Allows admins to moderate and deactivate items.';


-- Enable Row Level Security for the new table.
ALTER TABLE public.user_market_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies:

-- 1. Anyone can view active items.
CREATE POLICY "Allow public read access to active user market items"
ON public.user_market_items FOR SELECT USING (is_active = true);

-- 2. Premium users can insert items for themselves.
CREATE POLICY "Premium users can insert their own market items"
ON public.user_market_items FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_current_user_premium() = true);

-- 3. Users can update their own items.
CREATE POLICY "Users can update their own market items"
ON public.user_market_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own items.
CREATE POLICY "Users can delete their own market items"
ON public.user_market_items FOR DELETE USING (auth.uid() = user_id);

