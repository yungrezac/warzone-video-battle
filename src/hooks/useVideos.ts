
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
  // Добавляем правильные поля для пользовательских данных
  user_liked?: boolean;
  user_rating?: number;
  comments_count?: number;
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

        // Собираем финальные данные с правильными полями
        const videosWithStats = videos.map(video => {
          const likes = likesMap.get(video.id) || { count: 0, userLiked: false };
          const commentsCount = commentsMap.get(video.id) || 0;
          const ratings = ratingsMap.get(video.id) || { avg: 0, userRating: 0 };

          return {
            ...video,
            likes_count: likes.count,
            comments_count: commentsCount,
            average_rating: ratings.avg,
            user_liked: likes.userLiked, // Правильное поле для лайков пользователя
            user_rating: ratings.userRating, // Правильное поле для рейтинга пользователя
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
        throw new Error('Необходима авторизация для загрузки видео');
      }

      // Проверка размера файла (50MB)
      if (videoFile.size > 50 * 1024 * 1024) {
        throw new Error('Размер файла превышает 50MB. Сожмите видео.');
      }

      console.log('🎬 Начинаем загрузку видео для пользователя:', {
        userId: user.id,
        username: user.username || user.first_name,
        fileSize: `${(videoFile.size / 1024 / 1024).toFixed(2)}MB`,
        fileName: videoFile.name
      });
      onProgress?.(5);

      try {
        // Проверяем авторизацию пользователя повторно
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !currentUser || currentUser.id !== user.id) {
          throw new Error('Ошибка авторизации. Перезайдите в приложение');
        }

        onProgress?.(10);

        // Генерируем уникальное имя файла с данными пользователя
        const timestamp = Date.now();
        const fileExtension = videoFile.name.split('.').pop() || 'mp4';
        const sanitizedTitle = title.trim().replace(/[^a-zA-Zа-яёА-ЯЁ0-9]/g, '_').substring(0, 20);
        const videoFileName = `${user.id}/${timestamp}_${sanitizedTitle}.${fileExtension}`;
        
        console.log('📤 Загружаем видеофайл:', videoFileName, 'для пользователя:', user.id);
        onProgress?.(15);

        // Загружаем видео с явной привязкой к пользователю
        const { error: videoUploadError } = await supabase.storage
          .from('videos')
          .upload(videoFileName, videoFile, {
            cacheControl: '3600',
            upsert: false,
            metadata: {
              userId: user.id,
              username: user.username || user.first_name || 'unknown',
              uploadedAt: new Date().toISOString(),
              originalFileName: videoFile.name,
              category: category
            }
          });

        if (videoUploadError) {
          console.error('❌ Ошибка загрузки видео:', videoUploadError);
          if (videoUploadError.message.includes('exceeded') || 
              videoUploadError.message.includes('size') ||
              videoUploadError.message.includes('large')) {
            throw new Error('Файл слишком большой. Максимум: 50MB');
          }
          if (videoUploadError.message.includes('policy') || 
              videoUploadError.message.includes('RLS')) {
            throw new Error('Ошибка доступа. Перезайдите в приложение');
          }
          throw new Error(`Ошибка загрузки: ${videoUploadError.message}`);
        }

        onProgress?.(50);

        // Получаем URL видео
        const { data: videoUrlData } = supabase.storage
          .from('videos')
          .getPublicUrl(videoFileName);

        if (!videoUrlData?.publicUrl) {
          throw new Error('Не удалось получить URL видео');
        }

        console.log('✅ Видео загружено, URL:', videoUrlData.publicUrl);

        // Загружаем превью если есть
        let thumbnailUrl: string | undefined;
        if (thumbnailBlob) {
          onProgress?.(60);
          const thumbnailFileName = `${user.id}/${timestamp}_${sanitizedTitle}_thumb.jpg`;
          
          const { error: thumbnailError } = await supabase.storage
            .from('videos')
            .upload(thumbnailFileName, thumbnailBlob, {
              metadata: {
                userId: user.id,
                parentVideo: videoFileName,
                type: 'thumbnail'
              }
            });

          if (!thumbnailError) {
            const { data: thumbUrlData } = supabase.storage
              .from('videos')
              .getPublicUrl(thumbnailFileName);
            thumbnailUrl = thumbUrlData?.publicUrl;
            console.log('✅ Превью загружено:', thumbnailUrl);
          }
        }

        onProgress?.(70);

        // Сохраняем в БД с явной привязкой к пользователю
        console.log('💾 Сохраняем в базу данных для пользователя:', user.id);
        const { data: videoData, error: dbError } = await supabase
          .from('videos')
          .insert({
            title: title.trim(),
            description: description?.trim() || null,
            video_url: videoUrlData.publicUrl,
            thumbnail_url: thumbnailUrl || null,
            user_id: user.id, // Явно указываем ID пользователя
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
            await supabase.storage.from('videos').remove([`${user.id}/${timestamp}_${sanitizedTitle}_thumb.jpg`]);
          }
          
          if (dbError.message.includes('policy') || dbError.message.includes('RLS')) {
            throw new Error('Ошибка доступа к базе данных. Перезайдите в приложение');
          }
          throw new Error(`Ошибка сохранения: ${dbError.message}`);
        }

        onProgress?.(85);

        console.log('✅ Видео сохранено в БД:', videoData.id);

        // Обновляем достижения
        try {
          await supabase.rpc('update_achievement_progress', {
            p_user_id: user.id,
            p_category: 'videos',
            p_new_value: null,
            p_increment: 1,
          });
          console.log('🏆 Достижения обновлены для пользователя:', user.id);
        } catch (achievementError) {
          console.error('⚠️ Ошибка обновления достижений:', achievementError);
        }

        // Начисляем баллы за загрузку
        try {
          await supabase.rpc('update_user_points', {
            p_user_id: user.id,
            p_points_change: 10,
            p_description: `Загрузка видео: ${title.trim()}`
          });
          console.log('💰 Баллы начислены пользователю:', user.id);
        } catch (pointsError) {
          console.error('⚠️ Ошибка начисления баллов:', pointsError);
        }

        onProgress?.(100);
        console.log('🎉 Видео успешно загружено пользователем:', user.id);
        return videoData;

      } catch (error) {
        console.error('❌ Критическая ошибка загрузки для пользователя:', user.id, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('🔄 Обновляем кэш после загрузки пользователем:', user?.id, 'видео ID:', data?.id);
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};
