
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';

export const useLikePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      console.log('🔄 Обрабатываем лайк поста:', { postId, isLiked, userId: user.id });

      if (isLiked) {
        // Убираем лайк
        console.log('❌ Убираем лайк с поста...');
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Ошибка при удалении лайка с поста:', error);
          throw error;
        }

        // Обновляем счетчик лайков (уменьшаем на 1, но не ниже 0)
        const { data: currentPost } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();

        const newLikesCount = Math.max((currentPost?.likes_count || 0) - 1, 0);

        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes_count: newLikesCount })
          .eq('id', postId);

        if (updateError) {
          console.error('Ошибка при обновлении счетчика лайков поста:', updateError);
        }

        console.log('✅ Лайк с поста убран');
      } else {
        // Ставим лайк
        console.log('❤️ Ставим лайк посту...');
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (error) {
          console.error('Ошибка при добавлении лайка посту:', error);
          throw error;
        }

        // Обновляем счетчик лайков (увеличиваем на 1)
        const { data: currentPost } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();

        const newLikesCount = (currentPost?.likes_count || 0) + 1;

        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes_count: newLikesCount })
          .eq('id', postId);

        if (updateError) {
          console.error('Ошибка при обновлении счетчика лайков поста:', updateError);
        }

        console.log('✅ Лайк посту поставлен');
      }

      const newIsLiked = !isLiked;
      console.log('🏁 Завершили обработку лайка поста. Новое состояние:', newIsLiked);
      return { postId, isLiked: newIsLiked };
    },
    onSuccess: (data) => {
      console.log('✅ Мутация лайка поста успешна, обновляем кэш запросов...');
      // Инвалидируем все связанные кэши
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      console.error('❌ Ошибка при обработке лайка поста:', error);
    },
  });
};
