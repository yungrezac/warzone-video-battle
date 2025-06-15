
-- Add foreign key constraint to link online_tournaments.winner_id to profiles.id
ALTER TABLE public.online_tournaments 
ADD CONSTRAINT fk_online_tournaments_winner 
FOREIGN KEY (winner_id) REFERENCES public.profiles(id);
