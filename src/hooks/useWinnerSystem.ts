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
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Ошибка загрузки победителя:', error);
        throw error;
      }

      if (winner) {
        // Загружаем актуальную статистику видео
        const { count: likesCount, error: likesError } = await supabase
          .from('video_likes')
          .select('*', { count: 'exact', head: true })
          .eq('video_id', winner.id);
        
        if (likesError) console.warn('Ошибка загрузки лайков победителя:', likesError);

        const { count: commentsCount, error: commentsError } = await supabase
          .from('video_comments')
          .select('*', { count: 'exact', head: true })
          .eq('video_id', winner.id);
        
        if (commentsError) console.warn('Ошибка загрузки комментов победителя:', commentsError);
        
        // Логика получения averageRating удалена

        // Создаем новый объект с обновленной статистикой
        const updatedWinner = {
          ...winner,
          likes_count: likesCount || winner.likes_count || 0,
          comments_count: commentsCount || winner.comments_count || 0,
          // average_rating: Number(averageRating.toFixed(1)) // Удалено
        };

        console.log('Победитель найден с обновленной статистикой:', updatedWinner);
        return updatedWinner;
      }

      console.log('Победитель за вчера не найден или произошла ошибка (не PGRST116).');
      return null; // Возвращаем null если победитель не найден
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
        console.log('Нет видео для расчета победителя за вчера.');
        // throw new Error('Нет видео для расчета победителя'); // Не бросаем ошибку, просто выходим
        return null; 
      }

      console.log('Найдено видео для расчета:', videos.length);

      // Рассчитываем баллы для каждого видео
      let bestVideo = null;
      let bestScore = -1;

      for (const video of videos) {
        // Формула: лайки * 3 + просмотры * 0.1 (рейтинг удален)
        const score = (video.likes_count || 0) * 3 + 
                     (video.views || 0) * 0.1;

        console.log(`Видео ${video.id}: лайки=${video.likes_count}, просмотры=${video.views}, балл=${score}`);

        if (score > bestScore) {
          bestScore = score;
          bestVideo = video;
        }
      }

      if (!bestVideo) {
        console.log('Не удалось определить победителя.');
        // throw new Error('Не удалось определить победителя');
        return null;
      }

      console.log('Определен победитель:', bestVideo.id, 'с баллом:', bestScore);

      // Устанавливаем победителя
      // Сначала проверяем, нет ли уже победителя за эту дату
      const { data: existingWinner, error: existingWinnerError } = await supabase
        .from('videos')
        .select('id')
        .eq('winner_date', yesterday.toISOString().split('T')[0])
        .eq('is_winner', true)
        .maybeSingle();

      if (existingWinnerError && existingWinnerError.code !== 'PGRST116') {
        console.error('Ошибка проверки существующего победителя:', existingWinnerError);
        throw existingWinnerError;
      }

      if (existingWinner) {
        console.log(`Победитель за ${yesterday.toISOString().split('T')[0]} уже существует: ${existingWinner.id}. Новый расчет не требуется.`);
        return bestVideo; // Или null, если не хотим возвращать "старого" победителя
      }
      
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
      // ... keep existing code (points and achievements update logic)
      const { data: currentPoints, error: pointsSelectError } = await supabase
        .from('user_points')
        .select('total_points, wins_count')
        .eq('user_id', bestVideo.user_id)
        .single();

      if (pointsSelectError && pointsSelectError.code !== 'PGRST116') { // PGRST116 - no rows found, это ок
        console.warn('Ошибка получения текущих баллов (или пользователь без баллов):', pointsSelectError.message);
        // Создаем запись если её нет
        const { error: insertError } = await supabase
          .from('user_points')
          .insert({
            user_id: bestVideo.user_id,
            total_points: 100, // Баллы за победу
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
            total_points: (currentPoints?.total_points || 0) + 100, // Баллы за победу
            wins_count: (currentPoints?.wins_count || 0) + 1
          })
          .eq('user_id', bestVideo.user_id);

        if (pointsUpdateError) {
          console.error('Ошибка обновления баллов:', pointsUpdateError);
        }
      }

      // Обновляем достижения связанные с победами (вне зависимости от того, была ли запись user_points)
      try {
        // Получаем обновленное/созданное количество побед
        const { data: updatedUserPoints, error: fetchUpdatedPointsError } = await supabase
          .from('user_points')
          .select('wins_count')
          .eq('user_id', bestVideo.user_id)
          .single();

        if (fetchUpdatedPointsError) {
          console.error('Ошибка получения обновленных побед для достижений:', fetchUpdatedPointsError);
        } else if (updatedUserPoints) {
          await supabase.rpc('update_achievement_progress', {
            p_user_id: bestVideo.user_id,
            p_category: 'wins',
            p_new_value: updatedUserPoints.wins_count
          });
        }
      } catch (achievementError) {
        console.error('Ошибка обновления достижений:', achievementError);
      }


      console.log('Победитель установлен и баллы начислены');
      return bestVideo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yesterday-winner'] });
      queryClient.invalidateQueries({ queryKey: ['top-users'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] }); // Для обновления статы победителя
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      // queryClient.invalidateQueries({ queryKey: ['video_ratings'] }); // Удалено
    },
  });
};
