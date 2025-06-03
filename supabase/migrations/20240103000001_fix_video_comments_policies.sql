
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create their own comments" ON public.video_comments;

-- Create new policy that allows anyone to insert comments
CREATE POLICY "Anyone can create video comments" 
  ON public.video_comments 
  FOR INSERT 
  WITH CHECK (true);

-- Update other policies to be less restrictive since you're using custom auth
DROP POLICY IF EXISTS "Users can update their own comments" ON public.video_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.video_comments;

CREATE POLICY "Anyone can update video comments" 
  ON public.video_comments 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete video comments" 
  ON public.video_comments 
  FOR DELETE 
  USING (true);
