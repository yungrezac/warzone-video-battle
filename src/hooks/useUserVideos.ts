
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export const useUserVideos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-videos', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      console.log('Загружаем видео пользователя:', user.id);

      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Обрабатываем статистику для каждого видео
      const videosWithStats = await Promise.all(
        (videos || []).map(async (video) => {
          // Подсчитываем лайки для каждого видео
          const { count: likesCount, error: likesError } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', video.id);

          if (likesError) {
            console.warn(`⚠️ Ошибка при загрузке лайков для видео ${video.id} (useUserVideos):`, likesError);
          }

          // Подсчитываем комментарии для каждого видео
          const { count: commentsCount, error: commentsError } = await supabase
            .from('video_comments')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', video.id);

          if (commentsError) {
            console.warn(`⚠️ Ошибка при загрузке комментариев для видео ${video.id} (useUserVideos):`, commentsError);
          }

          // Лайкнул ли текущий пользователь
          let userLiked = false;

          // Этот запрос выполняется только если пользователь авторизован, что уже проверено в начале queryFn
          const { data: userLikeData } = await supabase
            .from('video_likes')
            .select('*')
            .eq('video_id', video.id)
            .eq('user_id', user.id)
            .maybeSingle();
          userLiked = !!userLikeData;

          console.log(`Статистика видео ${video.id}:`, {
            likes: likesCount,
            comments: commentsCount,
            userLiked: userLiked,
          });

          return {
            ...video,
            likes_count: likesCount || video.likes_count || 0,
            comments_count: commentsCount || video.comments_count || 0,
            user_liked: userLiked,
            // average_rating и user_rating удалены
            thumbnail_url: video.thumbnail_url || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
          };
        })
      );

      console.log('Видео пользователя с обновленной статистикой (без рейтинга):', videosWithStats);
      return videosWithStats;
    },
    enabled: !!user,
  });
};
