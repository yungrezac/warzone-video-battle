
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useAchievementTriggers } from './useAchievementTriggers';
import { useTelegramNotifications } from './useTelegramNotifications';

export interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  user_id: string;
  category: string;
  views: number;
  likes_count: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username?: string;
    telegram_username?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export const useVideos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      console.log('📺 Загружаем видео оптимизированным способом...');
      
      try {
        // Загружаем видео с профилями пользователей за один запрос
        const { data: videos, error } = await supabase
          .from('videos')
          .select(`
            *,
            user:profiles!user_id(
              id,
              username,
              telegram_username,
              first_name,
              last_name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50); // Ограничиваем количество видео для ускорения

        if (error) {
          console.error('❌ Ошибка загрузки видео:', error);
          throw error;
        }

        if (!videos || videos.length === 0) {
          console.log('📭 Видео не найдены');
          return [];
        }

        console.log(`📊 Загружено ${videos.length} видео, получаем статистику...`);

        // Получаем все video_ids для batch запросов
        const videoIds = videos.map(v => v.id);

        // Batch запрос для всех лайков
        const { data: allLikes } = await supabase
          .from('video_likes')
          .select('video_id, user_id')
          .in('video_id', videoIds);

        // Batch запрос для всех комментариев
        const { data: allComments } = await supabase
          .from('video_comments')
          .select('video_id')
          .in('video_id', videoIds);

        // Batch запрос для всех рейтингов
        const { data: allRatings } = await supabase
          .from('video_ratings')
          .select('video_id, rating, user_id')
          .in('video_id', videoIds);

        // Создаем маппинги для быстрого доступа
        const likesMap = new Map<string, { count: number; userLiked: boolean }>();
        const commentsMap = new Map<string, number>();
        const ratingsMap = new Map<string, { avg: number; userRating: number }>();

        // Обрабатываем лайки
        videoIds.forEach(videoId => {
          const videoLikes = allLikes?.filter(like => like.video_id === videoId) || [];
          const userLiked = user ? videoLikes.some(like => like.user_id === user.id) : false;
          likesMap.set(videoId, { count: videoLikes.length, userLiked });
        });

        // Обрабатываем комментарии
        videoIds.forEach(videoId => {
          const videoComments = allComments?.filter(comment => comment.video_id === videoId) || [];
          commentsMap.set(videoId, videoComments.length);
        });

        // Обрабатываем рейтинги
        videoIds.forEach(videoId => {
          const videoRatings = allRatings?.filter(rating => rating.video_id === videoId) || [];
          const avgRating = videoRatings.length > 0
            ? videoRatings.reduce((sum, r) => sum + r.rating, 0) / videoRatings.length
            : 0;
          const userRating = user 
            ? videoRatings.find(r => r.user_id === user.id)?.rating || 0
            : 0;
          ratingsMap.set(videoId, { avg: Number(avgRating.toFixed(1)), userRating });
        });

        // Собираем финальные данные
        const videosWithStats = videos.map(video => {
          const likes = likesMap.get(video.id) || { count: 0, userLiked: false };
          const commentsCount = commentsMap.get(video.id) || 0;
          const ratings = ratingsMap.get(video.id) || { avg: 0, userRating: 0 };

          return {
            ...video,
            likes_count: likes.count,
            comments_count: commentsCount,
            average_rating: ratings.avg,
            user_liked: likes.userLiked,
            user_rating: ratings.userRating,
            thumbnail_url: video.thumbnail_url || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
          };
        });

        console.log(`✅ Обработано ${videosWithStats.length} видео с полной статистикой`);
        return videosWithStats;

      } catch (error) {
        console.error('❌ Критическая ошибка загрузки видео:', error);
        throw error;
      }
    },
    staleTime: 30000, // Кэшируем на 30 секунд
    gcTime: 300000, // Храним в памяти 5 минут
  });
};

export const useLikeVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { triggerSocialLike } = useAchievementTriggers();
  const { sendLikeNotification } = useTelegramNotifications();

  return useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      console.log('💖 Обрабатываем лайк:', videoId, 'убираем:', isLiked);

      if (isLiked) {
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Убираем баллы за снятие лайка
        await supabase.rpc('update_user_points', {
          p_user_id: user.id,
          p_points_change: -2
        });
      } else {
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: user.id,
          });

        if (error) throw error;
        
        // Начисляем баллы за лайк
        await supabase.rpc('update_user_points', {
          p_user_id: user.id,
          p_points_change: 2
        });
        
        triggerSocialLike();

        // Отправляем уведомление
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
            const likerName = user.first_name || user.username || 'Роллер';
            await sendLikeNotification(videoWithUser.user.telegram_id, likerName, videoWithUser.title);
          }
        } catch (notificationError) {
          console.error('Ошибка отправки уведомления:', notificationError);
        }
      }
    },
    onSuccess: () => {
      console.log('🔄 Лайк обработан, обновляем кэш');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

export const useRateVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { triggerSocialRating } = useAchievementTriggers();

  return useMutation({
    mutationFn: async ({ videoId, rating }: { videoId: string; rating: number }) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      console.log('⭐ Ставим оценку:', videoId, 'рейтинг:', rating);

      const { error } = await supabase
        .from('video_ratings')
        .upsert({
          video_id: videoId,
          user_id: user.id,
          rating: rating,
        });

      if (error) throw error;
      
      // Начисляем балл за оценку
      await supabase.rpc('update_user_points', {
        p_user_id: user.id,
        p_points_change: 1
      });
      
      triggerSocialRating();
    },
    onSuccess: () => {
      console.log('🔄 Оценка поставлена, обновляем кэш');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

export const useUploadVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      videoFile,
      category,
      thumbnailBlob,
      trimStart,
      trimEnd,
      onProgress,
    }: {
      title: string;
      description?: string;
      videoFile: File;
      category: 'Rollers' | 'BMX' | 'Skateboard';
      thumbnailBlob?: Blob;
      trimStart?: number;
      trimEnd?: number;
      onProgress?: (progress: number) => void;
    }) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      // Проверка размера файла (25MB)
      if (videoFile.size > 25 * 1024 * 1024) {
        throw new Error('Размер файла превышает 25MB. Сожмите видео.');
      }

      console.log('🎬 Начинаем загрузку видео...');
      onProgress?.(10);

      try {
        // Генерируем уникальное имя файла
        const timestamp = Date.now();
        const fileExtension = videoFile.name.split('.').pop() || 'mp4';
        const videoFileName = `${user.id}/${timestamp}.${fileExtension}`;
        
        console.log('📤 Загружаем видеофайл:', videoFileName);
        onProgress?.(20);

        // Загружаем видео
        const { error: videoUploadError } = await supabase.storage
          .from('videos')
          .upload(videoFileName, videoFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (videoUploadError) {
          console.error('❌ Ошибка загрузки видео:', videoUploadError);
          if (videoUploadError.message.includes('exceeded') || 
              videoUploadError.message.includes('size') ||
              videoUploadError.message.includes('large')) {
            throw new Error('Файл слишком большой. Максимум: 25MB');
          }
          throw new Error(`Ошибка загрузки: ${videoUploadError.message}`);
        }

        onProgress?.(60);

        // Получаем URL видео
        const { data: videoUrlData } = supabase.storage
          .from('videos')
          .getPublicUrl(videoFileName);

        if (!videoUrlData?.publicUrl) {
          throw new Error('Не удалось получить URL видео');
        }

        // Загружаем превью если есть
        let thumbnailUrl: string | undefined;
        if (thumbnailBlob) {
          onProgress?.(70);
          const thumbnailFileName = `${user.id}/${timestamp}_thumb.jpg`;
          
          const { error: thumbnailError } = await supabase.storage
            .from('videos')
            .upload(thumbnailFileName, thumbnailBlob);

          if (!thumbnailError) {
            const { data: thumbUrlData } = supabase.storage
              .from('videos')
              .getPublicUrl(thumbnailFileName);
            thumbnailUrl = thumbUrlData?.publicUrl;
          }
        }

        onProgress?.(80);

        // Сохраняем в БД
        console.log('💾 Сохраняем в базу данных...');
        const { data: videoData, error: dbError } = await supabase
          .from('videos')
          .insert({
            title: title.trim(),
            description: description?.trim() || null,
            video_url: videoUrlData.publicUrl,
            thumbnail_url: thumbnailUrl || null,
            user_id: user.id,
            category: category,
            views: 0,
            likes_count: 0,
            average_rating: 0,
          })
          .select()
          .single();

        if (dbError) {
          console.error('❌ Ошибка сохранения в БД:', dbError);
          // Удаляем загруженные файлы при ошибке
          await supabase.storage.from('videos').remove([videoFileName]);
          if (thumbnailUrl) {
            await supabase.storage.from('videos').remove([`${user.id}/${timestamp}_thumb.jpg`]);
          }
          throw new Error(`Ошибка сохранения: ${dbError.message}`);
        }

        onProgress?.(90);

        // Обновляем достижения
        try {
          await supabase.rpc('update_achievement_progress', {
            p_user_id: user.id,
            p_category: 'videos',
            p_new_value: null,
            p_increment: 1,
          });
        } catch (achievementError) {
          console.error('⚠️ Ошибка обновления достижений:', achievementError);
        }

        onProgress?.(100);
        console.log('🎉 Видео успешно загружено!');
        return videoData;

      } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('🔄 Обновляем кэш после загрузки');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};
