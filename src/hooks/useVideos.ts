
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useTelegramNotifications } from './useTelegramNotifications';

interface Video {
  id: string;
  created_at: string;
  title: string;
  video_url: string;
  thumbnail_url: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  average_rating: number;
  views: number;
  is_winner: boolean;
  user_liked: boolean;
  user_rating: number;
  category: 'Rollers' | 'BMX' | 'Skateboard';
  profiles?: {
    username?: string;
    telegram_username?: string;
    avatar_url?: string;
  };
}

interface VideoLike {
  video_id: string;
  user_id: string;
}

interface VideoRating {
  video_id: string;
  user_id: string;
  rating: number;
}

interface UploadVideoParams {
  title: string;
  description?: string;
  videoFile: File;
  category: 'Rollers' | 'BMX' | 'Skateboard';
  thumbnailBlob?: Blob;
  trimStart?: number;
  trimEnd?: number;
  onProgress?: (progress: number) => void;
}

export const useVideos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['videos', user?.id],
    queryFn: async () => {
      console.log('🎬 Загружаем видео для пользователя:', user?.id);

      const { data: videos, error } = await supabase
        .from('videos')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            telegram_username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!videos) return [];

      // Обрабатываем статистику для каждого видео
      const videosWithStats = await Promise.all(
        videos.map(async (video) => {
          // Подсчитываем лайки для каждого видео
          const { count: likesCount } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          // Подсчитываем комментарии для каждого видео
          const { count: commentsCount } = await supabase
            .from('video_comments')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          // Подсчитываем средний рейтинг
          const { data: ratings } = await supabase
            .from('video_ratings')
            .select('rating')
            .eq('video_id', video.id);

          const averageRating = ratings && ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

          // Проверяем, лайкнул ли текущий пользователь это видео и его рейтинг (только если пользователь авторизован)
          let userLike = null;
          let userRatingData = null;

          if (user?.id) {
            const { data: likeData } = await supabase
              .from('video_likes')
              .select('*')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .maybeSingle();

            const { data: ratingData } = await supabase
              .from('video_ratings')
              .select('rating')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .maybeSingle();

            userLike = likeData;
            userRatingData = ratingData;
          }

          console.log(`📊 Статистика видео ${video.id}:`, {
            likes: likesCount,
            comments: commentsCount,
            avgRating: averageRating,
            userLiked: !!userLike,
            userRating: userRatingData?.rating || 0
          });

          return {
            ...video,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            average_rating: Number(averageRating.toFixed(1)),
            user_liked: !!userLike,
            user_rating: userRatingData?.rating || 0,
          };
        })
      );

      console.log('✅ Видео с обновленной статистикой загружены:', videosWithStats.length);
      return videosWithStats;
    },
  });
};

export const useUploadVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: UploadVideoParams) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      const { title, description, videoFile, category, thumbnailBlob, trimStart, trimEnd, onProgress } = params;
      
      console.log('🎬 Начинаем загрузку видео:', {
        userId: user.id,
        title,
        category,
        fileSize: `${(videoFile.size / 1024 / 1024).toFixed(2)}MB`
      });

      // Генерируем уникальные имена файлов
      const videoFileName = `${user.id}/${Date.now()}_${videoFile.name}`;
      const thumbnailFileName = thumbnailBlob ? `${user.id}/${Date.now()}_thumbnail.jpg` : null;

      try {
        onProgress?.(10);

        // Загружаем видео файл
        console.log('📹 Загружаем видео файл...');
        const { data: videoUpload, error: videoError } = await supabase.storage
          .from('videos')
          .upload(videoFileName, videoFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (videoError) {
          console.error('Ошибка загрузки видео:', videoError);
          throw new Error(`Ошибка загрузки видео: ${videoError.message}`);
        }

        onProgress?.(50);

        // Получаем публичный URL для видео
        const { data: videoUrlData } = supabase.storage
          .from('videos')
          .getPublicUrl(videoFileName);

        let thumbnailUrl = null;

        // Загружаем превью, если есть
        if (thumbnailBlob && thumbnailFileName) {
          console.log('🖼️ Загружаем превью...');
          const { data: thumbnailUpload, error: thumbnailError } = await supabase.storage
            .from('videos')
            .upload(thumbnailFileName, thumbnailBlob, {
              cacheControl: '3600',
              upsert: false,
            });

          if (thumbnailError) {
            console.warn('Ошибка загрузки превью:', thumbnailError);
          } else {
            const { data: thumbnailUrlData } = supabase.storage
              .from('videos')
              .getPublicUrl(thumbnailFileName);
            thumbnailUrl = thumbnailUrlData.publicUrl;
          }
        }

        onProgress?.(75);

        // Сохраняем запись в базе данных
        console.log('💾 Сохраняем в базу данных...');
        const { data: videoRecord, error: dbError } = await supabase
          .from('videos')
          .insert({
            title,
            description,
            video_url: videoUrlData.publicUrl,
            thumbnail_url: thumbnailUrl,
            user_id: user.id,
            category,
            views: 0,
            likes_count: 0,
            comments_count: 0,
          })
          .select()
          .single();

        if (dbError) {
          console.error('Ошибка сохранения в БД:', dbError);
          throw new Error(`Ошибка сохранения: ${dbError.message}`);
        }

        onProgress?.(90);

        // Обновляем достижения пользователя
        try {
          await supabase.rpc('update_achievement_progress', { 
            p_user_id: user.id,
            p_category: 'videos_uploaded',
            p_increment: 1
          });
        } catch (error) {
          console.warn('Ошибка обновления счетчика видео:', error);
        }

        onProgress?.(100);

        console.log('✅ Видео успешно загружено:', videoRecord);
        return videoRecord;
      } catch (error) {
        console.error('❌ Ошибка загрузки видео:', error);
        
        // Очищаем загруженные файлы в случае ошибки
        try {
          await supabase.storage.from('videos').remove([videoFileName]);
          if (thumbnailFileName) {
            await supabase.storage.from('videos').remove([thumbnailFileName]);
          }
        } catch (cleanupError) {
          console.warn('Ошибка очистки файлов:', cleanupError);
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
    },
    onError: (error) => {
      console.error('Ошибка мутации загрузки видео:', error);
    },
  });
};

export const useLikeVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { sendLikeNotification } = useTelegramNotifications();

  return useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      console.log('🔄 Обрабатываем лайк:', { videoId, isLiked, userId: user.id });

      if (isLiked) {
        // Убираем лайк
        console.log('❌ Убираем лайк...');
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Уменьшаем счетчик
        await supabase.rpc('decrement_likes_count', { video_id: videoId });
        console.log('✅ Лайк убран, счетчик уменьшен');
      } else {
        // Ставим лайк
        console.log('❤️ Ставим лайк...');
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: user.id,
          });

        if (error) throw error;

        // Увеличиваем счетчик
        await supabase.rpc('increment_likes_count', { video_id: videoId });
        console.log('✅ Лайк поставлен, счетчик увеличен');

        // Отправляем уведомление владельцу видео
        try {
          const { data: videoData } = await supabase
            .from('videos')
            .select(`
              title,
              user_id,
              profiles!inner(telegram_id, username, telegram_username)
            `)
            .eq('id', videoId)
            .single();

          if (videoData && videoData.profiles && videoData.user_id !== user.id) {
            const ownerTelegramId = videoData.profiles.telegram_id;
            const likerName = user.username || user.telegram_username || 'Пользователь';
            
            if (ownerTelegramId) {
              await sendLikeNotification(
                videoData.user_id,
                ownerTelegramId,
                likerName,
                videoData.title
              );
            }
          }
        } catch (error) {
          console.error('Ошибка отправки уведомления о лайке:', error);
        }
      }

      const newIsLiked = !isLiked;
      console.log('🏁 Завершили обработку лайка. Новое состояние:', newIsLiked);
      return { videoId, isLiked: newIsLiked };
    },
    onSuccess: (data) => {
      console.log('✅ Мутация лайка успешна, обновляем кэш запросов...');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
    },
    onError: (error) => {
      console.error('❌ Ошибка при обработке лайка:', error);
    },
  });
};

export const useRateVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ videoId, rating }: { videoId: string; rating: number }) => {
      if (!user?.id) {
        throw new Error('Необходима авторизация');
      }

      console.log('⭐ Ставим рейтинг:', { videoId, rating, userId: user.id });

      // Проверяем, есть ли уже рейтинг от этого пользователя
      const { data: existingRating } = await supabase
        .from('video_ratings')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRating) {
        // Обновляем существующий рейтинг
        const { error } = await supabase
          .from('video_ratings')
          .update({ rating, updated_at: new Date().toISOString() })
          .eq('id', existingRating.id);

        if (error) throw error;
        console.log('✅ Рейтинг обновлен');
      } else {
        // Создаем новый рейтинг
        const { error } = await supabase
          .from('video_ratings')
          .insert({
            video_id: videoId,
            user_id: user.id,
            rating,
          });

        if (error) throw error;
        console.log('✅ Рейтинг создан');
      }

      return { videoId, rating };
    },
    onSuccess: () => {
      console.log('✅ Мутация рейтинга успешна, обновляем кэш запросов...');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
    },
    onError: (error) => {
      console.error('❌ Ошибка при выставлении рейтинга:', error);
    },
  });
};
