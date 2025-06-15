
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useOnlineTournaments = () => {
  return useQuery({
    queryKey: ['online-tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('online_tournaments')
        .select(`
          *,
          tournament_participants(count),
          winner:profiles(username, first_name, avatar_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateTournament = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tournamentData: {
      title: string;
      description: string;
      banner_url: string;
      entry_cost_points: number;
      min_participants: number;
      end_date: string;
      judge_ids: string[];
    }) => {
      const { data: tournament, error: tournamentError } = await supabase
        .from('online_tournaments')
        .insert({
          creator_id: '649d5b0d-88f6-49fb-85dc-a88d6cba1327',
          title: tournamentData.title,
          description: tournamentData.description,
          banner_url: tournamentData.banner_url,
          entry_cost_points: tournamentData.entry_cost_points,
          min_participants: tournamentData.min_participants,
          end_date: tournamentData.end_date,
        })
        .select()
        .single();

      if (tournamentError) throw tournamentError;

      // Добавляем судей
      if (tournamentData.judge_ids.length > 0) {
        const { error: judgesError } = await supabase
          .from('tournament_judges')
          .insert(
            tournamentData.judge_ids.map(judge_id => ({
              tournament_id: tournament.id,
              judge_id,
            }))
          );

        if (judgesError) throw judgesError;
      }

      return tournament;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-tournaments'] });
      toast.success('Турнир успешно создан!');
    },
    onError: (error) => {
      console.error('Error creating tournament:', error);
      toast.error('Ошибка при создании турнира');
    },
  });
};

export const useJoinTournament = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tournamentId, userId }: { tournamentId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournamentId,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournament-participants'] });
      toast.success('Вы успешно присоединились к турниру!');
    },
    onError: (error) => {
      console.error('Error joining tournament:', error);
      toast.error('Ошибка при присоединении к турниру');
    },
  });
};

export const useTournamentParticipants = (tournamentId: string) => {
  return useQuery({
    queryKey: ['tournament-participants', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_participants')
        .select(`
          *,
          profiles(username, first_name, avatar_url)
        `)
        .eq('tournament_id', tournamentId);

      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
  });
};

export const useTournamentVideos = (tournamentId: string) => {
  return useQuery({
    queryKey: ['tournament-videos', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_videos')
        .select(`
          *,
          profiles!tournament_videos_user_id_fkey(username, first_name, avatar_url)
        `)
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
  });
};

export const useUploadTournamentVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tournamentId,
      userId,
      title,
      videoUrl,
      thumbnailUrl,
    }: {
      tournamentId: string;
      userId: string;
      title: string;
      videoUrl: string;
      thumbnailUrl?: string;
    }) => {
      const { data: video, error: videoError } = await supabase
        .from('tournament_videos')
        .insert({
          tournament_id: tournamentId,
          user_id: userId,
          title,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
        })
        .select()
        .single();

      if (videoError) throw videoError;

      // Обновляем участника с ID видео
      const { error: participantError } = await supabase
        .from('tournament_participants')
        .update({ video_id: video.id })
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId);

      if (participantError) throw participantError;

      return video;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-videos'] });
      queryClient.invalidateQueries({ queryKey: ['tournament-participants'] });
      toast.success('Видео успешно загружено!');
    },
    onError: (error) => {
      console.error('Error uploading tournament video:', error);
      toast.error('Ошибка при загрузке видео');
    },
  });
};

export const useRateVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tournamentId,
      videoId,
      judgeId,
      rating,
    }: {
      tournamentId: string;
      videoId: string;
      judgeId: string;
      rating: number;
    }) => {
      const { data, error } = await supabase
        .from('tournament_video_ratings')
        .upsert({
          tournament_id: tournamentId,
          video_id: videoId,
          judge_id: judgeId,
          rating,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-videos'] });
      toast.success('Оценка поставлена!');
    },
    onError: (error) => {
      console.error('Error rating video:', error);
      toast.error('Ошибка при выставлении оценки');
    },
  });
};
