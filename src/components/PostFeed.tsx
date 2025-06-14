
import React from 'react';
import { usePosts } from '@/hooks/usePosts';
import { useLikePost } from '@/hooks/usePostLikes';
import { useAuth } from '@/components/AuthWrapper';
import PostCard from './PostCard';
import { toast } from 'sonner';

const PostFeed: React.FC = () => {
  const { data: posts, isLoading, error } = usePosts();
  const { user } = useAuth();
  const likePostMutation = useLikePost();

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error('Войдите в систему, чтобы ставить лайки');
      return;
    }

    const post = posts?.find(p => p.id === postId);
    if (post) {
      console.log('🎯 PostFeed: Обрабатываем лайк для поста:', postId, 'текущий статус:', post.user_liked);
      try {
        await likePostMutation.mutateAsync({ 
          postId, 
          isLiked: post.user_liked || false 
        });
        console.log('✅ PostFeed: Лайк успешно обработан');
        toast.success(post.user_liked ? 'Лайк убран' : 'Лайк поставлен');
      } catch (error) {
        console.error('❌ PostFeed: Ошибка при обработке лайка:', error);
        toast.error('Ошибка при обработке лайка');
      }
    }
  };

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[300px] pb-16">
        <div className="text-center">
          <p className="text-red-600 mb-2">Ошибка загрузки постов</p>
          <p className="text-gray-500 text-sm">Попробуйте обновить страницу</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="space-y-4 p-2">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
              <div className="flex space-x-4">
                <div className="h-8 bg-gray-300 rounded w-16"></div>
                <div className="h-8 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="space-y-4 p-2">
        {posts?.map((post) => {
          const postUser = post.profiles;
          const displayName = postUser?.username || postUser?.telegram_username || 'Пользователь';
          
          return (
            <PostCard
              key={post.id}
              post={{
                id: post.id,
                content: post.content,
                author: displayName,
                authorAvatar: postUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
                mediaUrls: post.media_urls || [],
                likes: post.likes_count || 0,
                comments: post.comments_count || 0,
                timestamp: new Date(post.created_at).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                userLiked: post.user_liked || false,
                userId: post.user_id,
              }}
              onLike={handleLike}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PostFeed;
