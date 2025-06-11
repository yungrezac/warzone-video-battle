
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export const useUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      console.log('Загружаем профиль пользователя:', user.id);

      try {
        // Получаем профиль пользователя
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Ошибка загрузки профиля:', profileError);
          throw profileError;
        }

        // Если профиля нет, создаем его
        if (!profile) {
          console.log('Профиль не найден, создаем новый');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              avatar_url: user.avatar_url,
              telegram_id: user.telegram_id,
              telegram_username: user.telegram_username,
            })
            .select()
            .single();

          if (createError) {
            console.error('Ошибка создания профиля:', createError);
            // Возвращаем данные из контекста если не можем создать в базе
            return {
              ...user,
              total_points: 0,
              wins_count: 0,
              total_videos: 0,
              total_likes: 0,
              total_views: 0,
              videos: [],
              created_at: new Date().toISOString(),
            };
          }
          
          // Создаем запись в user_points для нового профиля
          await supabase
            .from('user_points')
            .insert({
              user_id: user.id,
              total_points: 0,
              wins_count: 0
            });
        }

        // Получаем баллы пользователя
        const { data: userPoints } = await supabase
          .from('user_points')
          .select('total_points, wins_count')
          .eq('user_id', user.id)
          .maybeSingle();

        // Если баллов нет, создаем запись
        let finalPoints = userPoints;
        if (!userPoints) {
          const { data: newPoints } = await supabase
            .from('user_points')
            .insert({
              user_id: user.id,
              total_points: 0,
              wins_count: 0
            })
            .select('total_points, wins_count')
            .maybeSingle();
          
          finalPoints = newPoints || { total_points: 0, wins_count: 0 };
        }

        // Получаем статистику видео
        const { data: userVideos } = await supabase
          .from('videos')
          .select('id, views')
          .eq('user_id', user.id);

        const totalVideos = userVideos?.length || 0;
        const totalViews = userVideos?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;

        // Получаем общее количество лайков
        let totalLikes = 0;
        if (userVideos && userVideos.length > 0) {
          const videoIds = userVideos.map(v => v.id);
          const { count: likesCount } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact' })
            .in('video_id', videoIds);
          
          totalLikes = likesCount || 0;
        }

        const finalProfile = profile || user;

        return {
          ...finalProfile,
          total_points: finalPoints?.total_points || 0,
          wins_count: finalPoints?.wins_count || 0,
          total_videos: totalVideos,
          total_likes: totalLikes,
          total_views: totalViews,
          videos: userVideos || [],
        };

      } catch (error) {
        console.error('Ошибка в useUserProfile:', error);
        // Возвращаем базовые данные из контекста при ошибке
        return {
          ...user,
          total_points: 0,
          wins_count: 0,
          total_videos: 0,
          total_likes: 0,
          total_views: 0,
          videos: [],
          created_at: new Date().toISOString(),
        };
      }
    },
    enabled: !!user,
    retry: 1, // Уменьшаем количество повторов для быстрой работы
    staleTime: 30000, // Кэшируем на 30 секунд
  });
};
