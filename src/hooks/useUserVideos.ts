
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export const useUserVideos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-videos', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data: videos, error } = await supabase
        .from('videos')
        .select(`
          *,
          video_likes (count),
          video_comments (count),
          video_ratings (rating)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Обрабатываем статистику для каждого видео
      const videosWithStats = videos?.map(video => {
        const likesCount = video.video_likes?.length || 0;
        const commentsCount = video.video_comments?.length || 0;
        const ratings = video.video_ratings || [];
        const averageRating = ratings.length > 0
          ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
          : 0;

        return {
          ...video,
          likes_count: likesCount,
          comments_count: commentsCount,
          average_rating: Number(averageRating.toFixed(1)),
        };
      }) || [];

      return videosWithStats;
    },
    enabled: !!user,
  });
};
