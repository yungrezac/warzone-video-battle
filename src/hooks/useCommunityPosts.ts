
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export interface CommunityPost {
  id: string;
  title: string;
  content?: string;
  category: 'general' | 'battle' | 'news';
  user_id: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  user?: {
    username?: string;
    telegram_username?: string;
    avatar_url?: string;
  };
}

export const useCommunityPosts = (category?: string) => {
  return useQuery({
    queryKey: ['community-posts', category],
    queryFn: async () => {
      console.log('Загружаем посты сообщества для категории:', category);
      
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          user:profiles!user_id(username, telegram_username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data: posts, error } = await query;

      if (error) {
        console.error('Ошибка загрузки постов:', error);
        throw error;
      }
      
      console.log('Посты загружены:', posts);
      return posts as CommunityPost[];
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ title, content, category }: { 
      title: string; 
      content?: string; 
      category: 'general' | 'battle' | 'news';
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Создаем пост:', { title, content, category, userId: user.id });

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          title,
          content,
          category,
          user_id: user.id,
        })
        .select(`
          *,
          user:profiles!user_id(username, telegram_username, avatar_url)
        `)
        .single();

      if (error) {
        console.error('Ошибка создания поста:', error);
        throw error;
      }
      
      console.log('Пост создан:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });
};
