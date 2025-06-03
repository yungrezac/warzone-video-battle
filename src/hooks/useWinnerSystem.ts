
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export interface WinnerResult {
  video_id: string;
  user_id: string;
  title: string;
  likes_count: number;
  average_rating: number;
  views: number;
  score: number;
  username: string;
  avatar_url: string;
  winner_date: string;
}

export const useGetDailyWinner = (date?: string) => {
  const targetDate = date || new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['daily-winner', targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          user_id,
          likes_count,
          average_rating,
          views,
          is_winner,
          winner_date,
          profiles!inner(username, avatar_url)
        `)
        .eq('is_winner', true)
        .eq('winner_date', targetDate)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
};

export const useCalculateDailyWinner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: string) => {
      // Получаем все видео за указанную дату
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          user_id,
          likes_count,
          average_rating,
          views,
          created_at,
          profiles!inner(username, avatar_url)
        `)
        .gte('created_at', `${date}T00:00:00`)
        .lt('created_at', `${date}T23:59:59`)
        .order('created_at', { ascending: false });

      if (videosError) throw videosError;
      if (!videos || videos.length === 0) {
        throw new Error('Нет видео за указанную дату');
      }

      // Вычисляем рейтинг для каждого видео
      const videosWithScore = videos.map(video => {
        const likes = video.likes_count || 0;
        const rating = video.average_rating || 0;
        const views = video.views || 0;
        
        // Формула рейтинга: лайки * 3 + рейтинг * 10 + просмотры * 0.1
        const score = likes * 3 + rating * 10 + views * 0.1;
        
        return {
          ...video,
          score: Math.round(score * 100) / 100
        };
      });

      // Находим видео с максимальным рейтингом
      const winner = videosWithScore.reduce((prev, current) => 
        prev.score > current.score ? prev : current
      );

      // Сбрасываем статус победителя у всех видео за эту дату
      await supabase
        .from('videos')
        .update({ is_winner: false, winner_date: null })
        .gte('created_at', `${date}T00:00:00`)
        .lt('created_at', `${date}T23:59:59`);

      // Устанавливаем победителя
      const { error: updateError } = await supabase
        .from('videos')
        .update({ 
          is_winner: true, 
          winner_date: date 
        })
        .eq('id', winner.id);

      if (updateError) throw updateError;

      // Начисляем баллы победителю
      const { error: pointsError } = await supabase
        .from('user_points')
        .update({ 
          total_points: supabase.sql`COALESCE(total_points, 0) + 100`,
          wins_count: supabase.sql`COALESCE(wins_count, 0) + 1`,
          updated_at: 'now()'
        })
        .eq('user_id', winner.user_id);

      if (pointsError) throw pointsError;

      // Обновляем достижения за победы
      await supabase.rpc('update_achievement_progress', {
        p_user_id: winner.user_id,
        p_category: 'wins',
        p_increment: 1
      });

      return {
        ...winner,
        winner_date: date
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-winner'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });
};

export const useGetWeeklyLeaderboard = () => {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return useQuery({
    queryKey: ['weekly-leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          user_id,
          profiles!inner(username, avatar_url),
          likes_count,
          average_rating,
          views
        `)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Группируем по пользователям и суммируем статистику
      const userStats = data.reduce((acc: any, video: any) => {
        const userId = video.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            username: video.profiles.username,
            avatar_url: video.profiles.avatar_url,
            total_likes: 0,
            total_rating: 0,
            total_views: 0,
            video_count: 0,
            score: 0
          };
        }
        
        acc[userId].total_likes += video.likes_count || 0;
        acc[userId].total_rating += video.average_rating || 0;
        acc[userId].total_views += video.views || 0;
        acc[userId].video_count += 1;
        
        return acc;
      }, {});

      // Вычисляем итоговый рейтинг и сортируем
      const leaderboard = Object.values(userStats).map((user: any) => {
        const avgRating = user.video_count > 0 ? user.total_rating / user.video_count : 0;
        user.score = user.total_likes * 3 + avgRating * 10 + user.total_views * 0.1;
        return user;
      }).sort((a: any, b: any) => b.score - a.score);

      return leaderboard.slice(0, 10); // Топ 10
    },
  });
};
