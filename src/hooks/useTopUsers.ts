
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTopUsers = () => {
  return useQuery({
    queryKey: ['top-users'],
    queryFn: async () => {
      console.log('Загружаем всех пользователей приложения...');

      // Загружаем всех пользователей из profiles с левым join к user_points
      const { data: allUsers, error } = await supabase
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
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Ошибка загрузки пользователей:', error);
        throw error;
      }

      // Преобразуем данные в нужный формат и сортируем по баллам
      const usersWithPoints = allUsers?.map(user => ({
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
        total_points: user.user_points?.[0]?.total_points || 0,
        wins_count: user.user_points?.[0]?.wins_count || 0
      })) || [];

      // Сортируем по убыванию баллов
      const sortedUsers = usersWithPoints.sort((a, b) => b.total_points - a.total_points);

      console.log(`Загружено ${sortedUsers.length} пользователей:`, sortedUsers);
      return sortedUsers;
    },
  });
};
