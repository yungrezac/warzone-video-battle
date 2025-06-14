
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTopUsers = () => {
  return useQuery({
    queryKey: ['top-users'],
    queryFn: async () => {
      console.log('Загружаем всех пользователей для рейтинга...');

      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          telegram_username,
          avatar_url,
          first_name,
          last_name,
          user_points!left(
            total_points,
            wins_count
          )
        `)
        .order('user_points.total_points', { ascending: false, nullsLast: true });

      if (error) {
        console.error('Ошибка загрузки пользователей для рейтинга:', error);
        throw error;
      }

      // Преобразуем данные в нужный формат
      const topUsers = users?.map(user => ({
        id: user.id,
        user_id: user.id,
        user: {
          id: user.id,
          username: user.username,
          telegram_username: user.telegram_username,
          avatar_url: user.avatar_url,
          first_name: user.first_name,
          last_name: user.last_name
        },
        total_points: user.user_points?.total_points || 0,
        wins_count: user.user_points?.wins_count || 0
      })) || [];

      console.log('Все пользователи для рейтинга загружены:', topUsers);
      return topUsers;
    },
  });
};
