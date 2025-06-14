
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

interface Post {
  id: string;
  content: string;
  media_urls: string[];
  user_id: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_liked: boolean;
  profiles?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    telegram_username?: string;
    avatar_url?: string;
  };
}

export const usePosts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['posts', user?.id],
    queryFn: async () => {
      console.log('📝 Загружаем посты для ленты...');

      // Основной запрос постов с профилями пользователей
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            username,
            first_name,
            last_name,
            telegram_username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Ошибка загрузки постов:', error);
        throw error;
      }

      console.log('✅ Загружено постов:', posts?.length);

      if (!posts || posts.length === 0) {
        return [];
      }

      // Получаем информацию о лайках пользователя
      const postsWithLikes = await Promise.all(
        posts.map(async (post) => {
          try {
            let userLiked = false;

            if (user?.id) {
              // Проверяем лайк пользователя
              const { data: userLike } = await supabase
                .from('post_likes')
                .select('*')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .maybeSingle();

              userLiked = !!userLike;
            }

            return {
              ...post,
              user_liked: userLiked,
            };
          } catch (error) {
            console.warn(`⚠️ Ошибка загрузки лайков для поста ${post.id}:`, error);
            return {
              ...post,
              user_liked: false,
            };
          }
        })
      );

      console.log('✅ Посты с информацией о лайках загружены');
      return postsWithLikes;
    },
  });
};
