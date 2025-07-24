import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useVideoBattles = () => {
  return useQuery({
    queryKey: ['video-battles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_battles')
        .select(`
          *,
          battle_participants(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateBattle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (battleData: {
      title: string;
      description: string;
      reference_video_url: string;
      reference_video_title: string;
      start_time: string;
      time_limit_minutes: number;
      prize_points: number;
      judge_ids: string[];
    }) => {
      const { data: battle, error: battleError } = await supabase
        .from('video_battles')
        .insert({
          organizer_id: '649d5b0d-88f6-49fb-85dc-a88d6cba1327', // Используем фиксированный ID для TrickMaster
          title: battleData.title,
          description: battleData.description,
          reference_video_url: battleData.reference_video_url,
          reference_video_title: battleData.reference_video_title,
          start_time: battleData.start_time,
          time_limit_minutes: battleData.time_limit_minutes,
          prize_points: battleData.prize_points,
        })
        .select()
        .single();

      if (battleError) throw battleError;

      // Добавляем судей
      if (battleData.judge_ids.length > 0) {
        const { error: judgesError } = await supabase
          .from('battle_judges')
          .insert(
            battleData.judge_ids.map(judge_id => ({
              battle_id: battle.id,
              judge_id,
            }))
          );

        if (judgesError) throw judgesError;
      }

      return battle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-battles'] });
      toast.success('Видеобатл успешно создан!');
    },
    onError: (error) => {
      console.error('Error creating battle:', error);
      toast.error('Ошибка при создании видеобатла');
    },
  });
};

export const useJoinBattle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ battleId, userId }: { battleId: string; userId: string }) => {
      const { data: existingParticipant, error: checkError } = await supabase
        .from('battle_participants')
        .select('id')
        .eq('battle_id', battleId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingParticipant) {
        throw new Error('Вы уже участвуете в этом батле');
      }

      const { data, error } = await supabase
        .from('battle_participants')
        .insert({
          battle_id: battleId,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-battles'] });
      queryClient.invalidateQueries({ queryKey: ['battle-participants'] });
      toast.success('Вы успешно присоединились к батлу!');
    },
    onError: (error) => {
      console.error('Error joining battle:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Ошибка при присоединении к батлу');
      }
    },
  });
};

export const useBattleParticipants = (battleId: string) => {
  return useQuery({
    queryKey: ['battle-participants', battleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('battle_participants')
        .select(`
          *,
          profiles(username, first_name, avatar_url)
        `)
        .eq('battle_id', battleId);

      if (error) throw error;
      return data;
    },
    enabled: !!battleId,
  });
};

export const useBattleVideos = (battleId: string) => {
  return useQuery({
    queryKey: ['battle-videos', battleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('battle_videos')
        .select(`
          *,
          battle_participants!participant_id(
            profiles!user_id(username, first_name, avatar_url)
          )
        `)
        .eq('battle_id', battleId)
        .order('sequence_number', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!battleId,
  });
};

export const useUploadBattleVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      battleId,
      participantId,
      videoUrl,
      title,
      sequenceNumber,
    }: {
      battleId: string;
      participantId: string;
      videoUrl: string;
      title: string;
      sequenceNumber: number;
    }) => {
      const { data, error } = await supabase
        .from('battle_videos')
        .insert({
          battle_id: battleId,
          participant_id: participantId,
          video_url: videoUrl,
          title,
          sequence_number: sequenceNumber,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-videos'] });
      toast.success('Видео успешно загружено!');
    },
    onError: (error) => {
      console.error('Error uploading battle video:', error);
      toast.error('Ошибка при загрузке видео');
    },
  });
};

export const useApproveVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      isApproved,
      judgeId,
    }: {
      videoId: string;
      isApproved: boolean;
      judgeId: string;
    }) => {
      const { data, error } = await supabase
        .from('battle_videos')
        .update({
          is_approved: isApproved,
          approved_by: judgeId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', videoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-videos'] });
      toast.success('Решение принято!');
    },
    onError: (error) => {
      console.error('Error approving video:', error);
      toast.error('Ошибка при принятии решения');
    },
  });
};

// Хук для запуска батла
export const useStartBattle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (battleId: string) => {
      // Выбираем первого участника
      const { data, error } = await supabase.rpc('select_next_battle_participant', {
        battle_id_param: battleId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-battles'] });
      toast.success('Батл запущен!');
    },
    onError: (error) => {
      console.error('Error starting battle:', error);
      toast.error('Ошибка при запуске батла');
    },
  });
};

// Хук для обновления видео батла после одобрения/отклонения
export const useProcessBattleVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      battleId,
      videoId,
      isApproved,
    }: {
      battleId: string;
      videoId: string;
      isApproved: boolean;
    }) => {
      if (isApproved) {
        // Обновляем эталонное видео
        const { data: video } = await supabase
          .from('battle_videos')
          .select('video_url, title')
          .eq('id', videoId)
          .single();

        if (video) {
          // Получаем текущую последовательность
          const { data: currentBattle } = await supabase
            .from('video_battles')
            .select('current_video_sequence')
            .eq('id', battleId)
            .single();

          await supabase
            .from('video_battles')
            .update({
              reference_video_url: video.video_url,
              reference_video_title: video.title,
              current_video_sequence: (currentBattle?.current_video_sequence || 0) + 1,
            })
            .eq('id', battleId);
        }

        // Выбираем следующего участника
        await supabase.rpc('select_next_battle_participant', {
          battle_id_param: battleId
        });
      } else {
        // Добавляем букву FULL участнику
        const { data: video } = await supabase
          .from('battle_videos')
          .select('participant_id')
          .eq('id', videoId)
          .single();

        if (video) {
          await supabase.rpc('add_full_letter_to_participant', {
            participant_id_param: video.participant_id
          });

          // Проверяем, есть ли еще активные участники
          await supabase.rpc('check_battle_winner', {
            battle_id_param: battleId
          });

          // Если батл не завершен, выбираем следующего участника
          const { data: battle } = await supabase
            .from('video_battles')
            .select('status')
            .eq('id', battleId)
            .single();

          if (battle?.status === 'active') {
            await supabase.rpc('select_next_battle_participant', {
              battle_id_param: battleId
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-battles'] });
      queryClient.invalidateQueries({ queryKey: ['battle-participants'] });
      queryClient.invalidateQueries({ queryKey: ['battle-videos'] });
    },
    onError: (error) => {
      console.error('Error processing battle video:', error);
      toast.error('Ошибка при обработке видео');
    },
  });
};
