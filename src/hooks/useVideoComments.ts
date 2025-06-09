
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useAchievementTriggers } from './useAchievementTriggers';
import { useTelegramNotifications } from './useTelegramNotifications';

export interface VideoComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  video_id: string;
  user?: {
    username?: string;
    telegram_username?: string;
    avatar_url?: string;
  };
}

export const useVideoComments = (videoId: string) => {
  return useQuery({
    queryKey: ['video-comments', videoId],
    queryFn: async () => {
      console.log('Загружаем комментарии для видео:', videoId);
      
      const { data: comments, error } = await supabase
        .from('video_comments')
        .select(`
          *,
          user:profiles!user_id(username, telegram_username, avatar_url)
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Ошибка загрузки комментариев:', error);
        throw error;
      }
      
      console.log('Комментарии загружены:', comments);
      return comments as VideoComment[];
    },
    enabled: !!videoId,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { triggerComment } = useAchievementTriggers();
  const { sendCommentNotification } = useTelegramNotifications();

  return useMutation({
    mutationFn: async ({ videoId, content }: { videoId: string; content: string }) => {
      if (!user?.id) {
        console.error('Пользователь не авторизован');
        throw new Error('User not authenticated');
      }

      console.log('🎯 Добавляем комментарий:', { videoId, content, userId: user.id });

      // Получаем информацию о видео и его владельце
      const { data: video } = await supabase
        .from('videos')
        .select('user_id, title')
        .eq('id', videoId)
        .single();

      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content,
        })
        .select(`
          *,
          user:profiles!user_id(username, telegram_username, avatar_url)
        `)
        .single();

      if (error) {
        console.error('❌ Ошибка добавления комментария:', error);
        throw error;
      }
      
      console.log('✅ Комментарий добавлен:', data);

      // Начисляем 3 балла за комментарий
      console.log('💰 Начисляем 3 балла за комментарий...');
      const { data: pointsData, error: pointsError } = await supabase.rpc('update_user_points', {
        p_user_id: user.id,
        p_points_change: 3
      });

      if (pointsError) {
        console.error('❌ Ошибка при начислении баллов за комментарий:', pointsError);
      } else {
        console.log('✅ Баллы за комментарий начислены успешно:', pointsData);
      }

      // Trigger achievement for commenting
      console.log('🏆 Обновляем достижения за комментарий...');
      triggerComment();

      // Обновляем достижения владельца видео за полученные комментарии
      if (video?.user_id && video.user_id !== user.id) {
        console.log('🏆 Обновляем достижения владельца видео за полученный комментарий...');
        
        // Получаем новое количество комментариев для владельца видео
        const { data: ownerVideos } = await supabase
          .from('videos')
          .select('id')
          .eq('user_id', video.user_id);

        if (ownerVideos) {
          const videoIds = ownerVideos.map(v => v.id);
          const { count: totalComments } = await supabase
            .from('video_comments')
            .select('*', { count: 'exact' })
            .in('video_id', videoIds);

          // Обновляем достижения за полученные комментарии
          const { error: achievementError } = await supabase.rpc('update_achievement_progress', {
            p_user_id: video.user_id,
            p_category: 'comments',
            p_new_value: totalComments || 0,
            p_increment: 1
          });

          if (achievementError) {
            console.error('❌ Ошибка обновления достижений владельца за комментарии:', achievementError);
          } else {
            console.log('✅ Достижения владельца за комментарии обновлены');
          }
        }
      }

      // Отправляем уведомление владельцу видео
      try {
        const { data: videoWithUser } = await supabase
          .from('videos')
          .select(`
            title,
            user_id,
            user:profiles!user_id(telegram_id, username, first_name)
          `)
          .eq('id', videoId)
          .single();

        if (videoWithUser && videoWithUser.user?.telegram_id && videoWithUser.user_id !== user.id) {
          const commenterName = user.first_name || user.username || 'Роллер';
          await sendCommentNotification(videoWithUser.user.telegram_id, commenterName, videoWithUser.title, content);
        }
      } catch (notificationError) {
        console.error('Ошибка отправки уведомления о комментарии:', notificationError);
      }
      
      return data;
    },
    onSuccess: (data, { videoId }) => {
      console.log('🔄 Комментарий успешно добавлен, обновляем кэш');
      // Обновляем кэш комментариев для данного видео
      queryClient.invalidateQueries({ queryKey: ['video-comments', videoId] });
      // Также обновляем счетчик комментариев в списке видео
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      // Обновляем профиль пользователя для отображения новых баллов
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      // Обновляем достижения
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
    onError: (error) => {
      console.error('❌ Ошибка добавления комментария:', error);
    },
  });
};
