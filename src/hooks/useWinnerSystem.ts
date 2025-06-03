
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useYesterdayWinner = () => {
  return useQuery({
    queryKey: ['yesterday-winner'],
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

      console.log('Победитель найден:', winner);
      return winner;
    },
  });
};

export const useTopUsers = () => {
  return useQuery({
    queryKey: ['top-users'],
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
            last_name
          )
        `)
        .order('total_points', { ascending: false })
        .limit(10);

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

      // Начисляем баллы пользователю - используем обычный update вместо несуществующей функции
      const { data: currentPoints } = await supabase
        .from('user_points')
        .select('total_points, wins_count')
        .eq('user_id', bestVideo.user_id)
        .single();

      const { error: pointsError } = await supabase
        .from('user_points')
        .update({
          total_points: (currentPoints?.total_points || 0) + 100,
          wins_count: (currentPoints?.wins_count || 0) + 1
        })
        .eq('user_id', bestVideo.user_id);

      if (pointsError) {
        console.error('Ошибка начисления баллов:', pointsError);
        // Продолжаем, даже если не удалось начислить баллы
      }

      console.log('Победитель установлен и баллы начислены');
      return bestVideo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yesterday-winner'] });
      queryClient.invalidateQueries({ queryKey: ['top-users'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};
