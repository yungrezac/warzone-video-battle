import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export const useYesterdayWinner = () => {
  const queryClient = useQueryClient();
  const queryKey = ['yesterday-winner'];

  useEffect(() => {
    const channel = supabase
      .channel('winner-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'videos' }, (payload) => {
        if (payload.new.is_winner) {
          queryClient.invalidateQueries({ queryKey: ['yesterday-winner'] });
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      console.log('Загружаем победителя вчерашнего дня:', yesterdayStr);

      const { data: winner, error } = await supabase
        .from('videos')
        .select(`
          *,
          user:profiles!user_id(
            id,
            username,
            telegram_username,
            avatar_url,
            first_name,
            last_name
          )
        `)
        .eq('is_winner', true)
        .eq('winner_date', yesterdayStr)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Ошибка загрузки победителя:', error);
        throw error;
      }

      if (winner) {
        // Загружаем актуальную статистику видео
        const { count: likesCount } = await supabase
          .from('video_likes')
          .select('*', { count: 'exact' })
          .eq('video_id', winner.id);

        const { count: commentsCount } = await supabase
          .from('video_comments')
          .select('*', { count: 'exact' })
          .eq('video_id', winner.id);

        const { data: ratings } = await supabase
          .from('video_ratings')
          .select('rating')
          .eq('video_id', winner.id);

        const averageRating = ratings && ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;

        // Создаем новый объект с обновленной статистикой
        const updatedWinner = {
          ...winner,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          average_rating: Number(averageRating.toFixed(1))
        };

        console.log('Победитель найден с обновленной статистикой:', updatedWinner);
        return updatedWinner;
      }

      return winner;
    },
  });
};

export const useTopUsers = () => {
  const queryClient = useQueryClient();
  const queryKey = ['top-users'];

  useEffect(() => {
    const channel = supabase
      .channel('top-users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_points' }, () => {
        queryClient.invalidateQueries({ queryKey: ['top-users'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['top-users'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('Загружаем топ пользователей...');

      const { data: topUsers, error } = await supabase
        .from('user_points')
        .select(`
          *,
          user:profiles!user_id(
            id,
            username,
            telegram_username,
            avatar_url,
            first_name,
            last_name,
            is_premium
          )
        `)
        .gt('total_points', 0)
        .order('total_points', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки топа пользователей:', error);
        throw error;
      }

      console.log('Топ пользователи загружены:', topUsers);
      return topUsers;
    },
  });
};

export const useCalculateWinner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('Начинаем расчет победителя дня...');

      // Получаем все видео за вчерашний день
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(yesterday);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .gte('created_at', yesterdayStart.toISOString())
        .lte('created_at', yesterdayEnd.toISOString());

      if (videosError) {
        console.error('Ошибка получения видео:', videosError);
        throw videosError;
      }

      if (!videos || videos.length === 0) {
        throw new Error('Нет видео для расчета победителя');
      }

      console.log('Найдено видео для расчета:', videos.length);

      // Рассчитываем баллы для каждого видео
      let bestVideo = null;
      let bestScore = -1;

      for (const video of videos) {
        // Формула: лайки * 3 + рейтинг * 10 + просмотры * 0.1
        const score = (video.likes_count || 0) * 3 + 
                     (video.average_rating || 0) * 10 + 
                     (video.views || 0) * 0.1;

        console.log(`Видео ${video.id}: лайки=${video.likes_count}, рейтинг=${video.average_rating}, просмотры=${video.views}, балл=${score}`);

        if (score > bestScore) {
          bestScore = score;
          bestVideo = video;
        }
      }

      if (!bestVideo) {
        throw new Error('Не удалось определить победителя');
      }

      console.log('Определен победитель:', bestVideo.id, 'с баллом:', bestScore);

      // Устанавливаем победителя
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          is_winner: true,
          winner_date: yesterday.toISOString().split('T')[0]
        })
        .eq('id', bestVideo.id);

      if (updateError) {
        console.error('Ошибка установки победителя:', updateError);
        throw updateError;
      }

      // Начисляем баллы пользователю и обновляем достижения
      const { data: currentPoints, error: pointsSelectError } = await supabase
        .from('user_points')
        .select('total_points, wins_count')
        .eq('user_id', bestVideo.user_id)
        .single();

      if (pointsSelectError) {
        console.error('Ошибка получения текущих баллов:', pointsSelectError);
        // Создаем запись если её нет
        const { error: insertError } = await supabase
          .from('user_points')
          .insert({
            user_id: bestVideo.user_id,
            total_points: 100,
            wins_count: 1
          });
        
        if (insertError) {
          console.error('Ошибка создания записи баллов:', insertError);
        }
      } else {
        // Обновляем существующую запись
        const { error: pointsUpdateError } = await supabase
          .from('user_points')
          .update({
            total_points: (currentPoints?.total_points || 0) + 100,
            wins_count: (currentPoints?.wins_count || 0) + 1
          })
          .eq('user_id', bestVideo.user_id);

        if (pointsUpdateError) {
          console.error('Ошибка обновления баллов:', pointsUpdateError);
        }

        // Обновляем достижения связанные с победами
        try {
          await supabase.rpc('update_achievement_progress', {
            p_user_id: bestVideo.user_id,
            p_category: 'wins',
            p_new_value: (currentPoints?.wins_count || 0) + 1
          });
        } catch (achievementError) {
          console.error('Ошибка обновления достижений:', achievementError);
        }
      }

      console.log('Победитель установлен и баллы начислены');
      return bestVideo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yesterday-winner'] });
      queryClient.invalidateQueries({ queryKey: ['top-users'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });
};
