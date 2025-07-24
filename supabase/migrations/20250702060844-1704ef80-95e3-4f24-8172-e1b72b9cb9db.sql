
-- Enable RLS on video_battles table if not already enabled
ALTER TABLE public.video_battles ENABLE ROW LEVEL SECURITY;

-- Policy to allow organizers to create battles
CREATE POLICY "Organizers can create battles" ON public.video_battles
FOR INSERT WITH CHECK (
  auth.uid() = organizer_id
);

-- Policy to allow organizers to view their own battles
CREATE POLICY "Organizers can view their battles" ON public.video_battles
FOR SELECT USING (
  auth.uid() = organizer_id
);

-- Policy to allow organizers to update their own battles
CREATE POLICY "Organizers can update their battles" ON public.video_battles
FOR UPDATE USING (
  auth.uid() = organizer_id
);

-- Policy to allow all authenticated users to view battles (for participation)
CREATE POLICY "Users can view all battles" ON public.video_battles
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- Policy to allow organizers to delete their battles
CREATE POLICY "Organizers can delete their battles" ON public.video_battles
FOR DELETE USING (
  auth.uid() = organizer_id
);
