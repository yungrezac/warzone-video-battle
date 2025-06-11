
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { useAchievementTriggers } from './useAchievementTriggers';
import { useTelegramNotifications } from './useTelegramNotifications';
import { toast } from 'sonner';

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  user_id: string;
  views: number;
  created_at: string;
  updated_at: string;
  is_winner?: boolean;
  winner_date?: string;
  category: string;
  user?: {
    id: string;
    username?: string;
    telegram_username?: string;
    avatar_url?: string;
  };
  likes_count?: number;
  comments_count?: number;
  average_rating?: number;
  user_liked?: boolean;
  user_rating?: number;
}

export const useVideos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['videos', user?.id],
    queryFn: async () => {
      console.log('Загружаем видео для пользователя:', user?.id);
      
      // Получаем видео
      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки видео:', error);
        throw error;
      }

      // Получаем дополнительную статистику для каждого видео
      const videosWithStats = await Promise.all(
        videos.map(async (video) => {
          console.log('Статистика видео', video.id, ':');
          
          // Получаем информацию о пользователе
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('username, avatar_url, telegram_username')
            .eq('id', video.user_id)
            .single();

          // Количество лайков
          const { count: likesCount } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          // Количество комментариев
          const { count: commentsCount } = await supabase
            .from('video_comments')
            .select('*', { count: 'exact' })
            .eq('video_id', video.id);

          // Средний рейтинг
          const { data: ratings } = await supabase
            .from('video_ratings')
            .select('rating')
            .eq('video_id', video.id);

          const averageRating = ratings && ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

          // Лайкнул ли текущий пользователь и его рейтинг
          let userLiked = false;
          let userRating = 0;

          if (user?.id) {
            const { data: userLike } = await supabase
              .from('video_likes')
              .select('*')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .maybeSingle();

            userLiked = !!userLike;

            const { data: userRatingData } = await supabase
              .from('video_ratings')
              .select('rating')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .maybeSingle();

            userRating = userRatingData?.rating || 0;
          }

          const videoStats = {
            likes: likesCount || 0,
            comments: commentsCount || 0,
            avgRating: Number(averageRating.toFixed(1)),
            userLiked,
            userRating,
          };
          
          console.log('Статистика видео', video.id, ':', videoStats);

          return {
            ...video,
            user: userProfile,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            average_rating: Number(averageRating.toFixed(1)),
            user_liked: userLiked,
            user_rating: userRating,
            thumbnail_url: video.thumbnail_url || 'https://www.proskating.by/upload/iblock/04d/2w63xqnuppkahlgzmab37ke1gexxxneg/%D0%B7%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.jpg',
          };
        })
      );

      console.log('Видео с обновленной статистикой:', videosWithStats);
      return videosWithStats;
    },
  });
};

export const useLikeVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { triggerSocialLike, triggerLikeReceived } = useAchievementTriggers();
  const { sendLikeNotification } = useTelegramNotifications();

  return useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('💖 Mutation - Like video:', videoId, 'isLiked:', isLiked);

      // Получаем информацию о видео и его владельце
      const { data: video } = await supabase
        .from('videos')
        .select('user_id, title')
        .eq('id', videoId)
        .single();

      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Убираем 2 балла за снятие лайка
        console.log('💰 Убираем 2 балла за снятие лайка...');
        const { data: pointsData, error: pointsError } = await supabase.rpc('update_user_points', {
          p_user_id: user.id,
          p_points_change: -2
        });

        if (pointsError) {
          console.error('❌ Ошибка при снятии баллов за убранный лайк:', pointsError);
        } else {
          console.log('✅ Баллы за убранный лайк сняты успешно:', pointsData);
        }

        // Обновляем достижения владельца видео за полученные лайки
        if (video?.user_id) {
          console.log('🏆 Обновляем достижения владельца видео за убранный лайк...');
          
          // Получаем новое количество лайков для владельца видео
          const { data: ownerVideos } = await supabase
            .from('videos')
            .select('id')
            .eq('user_id', video.user_id);

          if (ownerVideos) {
            const videoIds = ownerVideos.map(v => v.id);
            const { count: totalLikes } = await supabase
              .from('video_likes')
              .select('*', { count: 'exact' })
              .in('video_id', videoIds);

            // Обновляем достижения за полученные лайки
            const { error: achievementError } = await supabase.rpc('update_achievement_progress', {
              p_user_id: video.user_id,
              p_category: 'likes',
              p_new_value: totalLikes || 0,
              p_increment: 1
            });

            if (achievementError) {
              console.error('❌ Ошибка обновления достижений владельца за лайки:', achievementError);
            }
          }
        }
      } else {
        // Add like
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: user.id,
          });

        if (error) throw error;
        
        // Начисляем 2 балла за лайк
        console.log('💰 Начисляем 2 балла за лайк...');
        const { data: pointsData, error: pointsError } = await supabase.rpc('update_user_points', {
          p_user_id: user.id,
          p_points_change: 2
        });

        if (pointsError) {
          console.error('❌ Ошибка при начислении баллов за лайк:', pointsError);
        } else {
          console.log('✅ Баллы за лайк начислены успешно:', pointsData);
        }
        
        // Trigger achievement for liking other videos
        console.log('🏆 Обновляем достижения за лайк...');
        triggerSocialLike();

        // Обновляем достижения владельца видео за полученные лайки
        if (video?.user_id && video.user_id !== user.id) {
          console.log('🏆 Обновляем достижения владельца видео за полученный лайк...');
          
          // Получаем новое количество лайков для владельца видео
          const { data: ownerVideos } = await supabase
            .from('videos')
            .select('id')
            .eq('user_id', video.user_id);

          if (ownerVideos) {
            const videoIds = ownerVideos.map(v => v.id);
            const { count: totalLikes } = await supabase
              .from('video_likes')
              .select('*', { count: 'exact' })
              .in('video_id', videoIds);

            // Обновляем достижения за полученные лайки
            const { error: achievementError } = await supabase.rpc('update_achievement_progress', {
              p_user_id: video.user_id,
              p_category: 'likes',
              p_new_value: totalLikes || 0,
              p_increment: 1
            });

            if (achievementError) {
              console.error('❌ Ошибка обновления достижений владельца за лайки:', achievementError);
            } else {
              console.log('✅ Достижения владельца за лайки обновлены');
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
            const likerName = user.first_name || user.username || 'Роллер';
            await sendLikeNotification(videoWithUser.user.telegram_id, likerName, videoWithUser.title);
          }
        } catch (notificationError) {
          console.error('Ошибка отправки уведомления о лайке:', notificationError);
        }
      }
    },
    onSuccess: () => {
      console.log('🔄 Лайк обработан успешно, обновляем кэш');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
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
        throw new Error('User not authenticated');
      }

      console.log('⭐ Mutation - Rate video:', videoId, 'rating:', rating);

      // Получаем информацию о видео и его владельце
      const { data: video } = await supabase
        .from('videos')
        .select('user_id')
        .eq('id', videoId)
        .single();

      const { error } = await supabase
        .from('video_ratings')
        .upsert({
          video_id: videoId,
          user_id: user.id,
          rating: rating,
        });

      if (error) throw error;
      
      // Начисляем 1 балл за оценку
      console.log('💰 Начисляем 1 балл за оценку...');
      const { data: pointsData, error: pointsError } = await supabase.rpc('update_user_points', {
        p_user_id: user.id,
        p_points_change: 1
      });

      if (pointsError) {
        console.error('❌ Ошибка при начислении баллов за оценку:', pointsError);
      } else {
        console.log('✅ Баллы за оценку начислены успешно:', pointsData);
      }
      
      // Trigger achievement for rating other videos
      console.log('🏆 Обновляем достижения за оценку...');
      triggerSocialRating();

      // Обновляем достижения владельца видео за полученные рейтинги
      if (video?.user_id && video.user_id !== user.id) {
        console.log('🏆 Обновляем достижения владельца видео за полученный рейтинг...');
        
        // Получаем новую статистику рейтингов для владельца видео
        const { data: ownerVideos } = await supabase
          .from('videos')
          .select('id')
          .eq('user_id', video.user_id);

        if (ownerVideos) {
          const videoIds = ownerVideos.map(v => v.id);
          
          // Получаем все рейтинги для видео владельца
          const { data: allRatings } = await supabase
            .from('video_ratings')
            .select('rating')
            .in('video_id', videoIds);

          if (allRatings && allRatings.length > 0) {
            const totalRatings = allRatings.length;
            const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

            // Обновляем достижения за количество рейтингов
            const { error: ratingsError } = await supabase.rpc('update_achievement_progress', {
              p_user_id: video.user_id,
              p_category: 'ratings',
              p_new_value: totalRatings,
              p_increment: 1
            });

            if (ratingsError) {
              console.error('❌ Ошибка обновления достижений владельца за рейтинги:', ratingsError);
            } else {
              console.log('✅ Достижения владельца за рейтинги обновлены');
            }

            // Обновляем достижения за средний рейтинг
            if (averageRating >= 4.5) {
              const { error: avgRatingError } = await supabase.rpc('update_achievement_progress', {
                p_user_id: video.user_id,
                p_category: 'rating_avg',
                p_new_value: Math.round(averageRating * 10),
                p_increment: 1
              });

              if (avgRatingError) {
                console.error('❌ Ошибка обновления достижений владельца за средний рейтинг:', avgRatingError);
              }
            }
          }
        }
      }
    },
    onSuccess: () => {
      console.log('🔄 Оценка выставлена успешно, обновляем кэш');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });
};

export const useUploadVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { triggerVideoUpload } = useAchievementTriggers();

  return useMutation({
    mutationFn: async ({ 
      title, 
      description, 
      videoFile,
      category,
      thumbnailBlob,
      trimStart,
      trimEnd,
      onProgress
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
        throw new Error('User not authenticated');
      }

      console.log('🎬 Начинаем загрузку видео для пользователя:', user.id);

      // Проверяем размер файла (максимум 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (videoFile.size > maxSize) {
        throw new Error('Размер файла не должен превышать 100MB');
      }

      // Generate a unique filename with timestamp
      const fileExt = videoFile.name.split('.').pop()?.toLowerCase();
      const allowedFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
      
      if (!fileExt || !allowedFormats.includes(fileExt)) {
        throw new Error('Поддерживаются только форматы: MP4, MOV, AVI, MKV, WEBM');
      }

      const timestamp = Date.now();
      const fileName = `video_${timestamp}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('📁 Загружаем файл в хранилище...', filePath);

      try {
        // Создаем хранилище если его нет
        const { data: buckets } = await supabase.storage.listBuckets();
        const videoBucket = buckets?.find(bucket => bucket.name === 'videos');
        
        if (!videoBucket) {
          console.log('📦 Создаем хранилище videos...');
          const { error: bucketError } = await supabase.storage.createBucket('videos', {
            public: true,
            fileSizeLimit: maxSize,
            allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm']
          });
          
          if (bucketError && !bucketError.message.includes('already exists')) {
            console.error('❌ Ошибка создания хранилища:', bucketError);
            throw new Error('Не удалось создать хранилище для видео');
          }
        }

        // Upload video file with progress tracking
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, videoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Ошибка загрузки в хранилище:', uploadError);
          if (uploadError.message.includes('already exists')) {
            throw new Error('Файл с таким именем уже существует. Попробуйте еще раз.');
          }
          throw new Error(`Ошибка загрузки: ${uploadError.message}`);
        }

        if (onProgress) onProgress(50); // 50% after video upload

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        console.log('✅ Файл загружен, создаем запись в БД...', publicUrl);

        // Upload thumbnail if provided
        let thumbnailUrl = null;
        if (thumbnailBlob) {
          try {
            const thumbnailFileName = `thumbnail_${timestamp}.jpg`;
            const thumbnailPath = `${user.id}/thumbnails/${thumbnailFileName}`;
            
            const { error: thumbnailError } = await supabase.storage
              .from('videos')
              .upload(thumbnailPath, thumbnailBlob, {
                cacheControl: '3600',
                upsert: false
              });

            if (!thumbnailError) {
              const { data: { publicUrl: thumbnailPublicUrl } } = supabase.storage
                .from('videos')
                .getPublicUrl(thumbnailPath);
              thumbnailUrl = thumbnailPublicUrl;
              console.log('📷 Превью загружено:', thumbnailUrl);
            } else {
              console.warn('⚠️ Не удалось загрузить превью:', thumbnailError);
            }
          } catch (thumbnailError) {
            console.warn('⚠️ Ошибка загрузки превью:', thumbnailError);
            // Продолжаем без превью
          }
        }

        if (onProgress) onProgress(75); // 75% after thumbnail upload

        // Create video record in database
        const { data: videoData, error: dbError } = await supabase
          .from('videos')
          .insert({
            title: title.trim(),
            description: description?.trim() || null,
            video_url: publicUrl,
            thumbnail_url: thumbnailUrl,
            user_id: user.id,
            category,
          })
          .select()
          .single();

        if (dbError) {
          console.error('❌ Ошибка создания записи в БД:', dbError);
          // Удаляем загруженный файл если не удалось создать запись
          await supabase.storage.from('videos').remove([filePath]);
          if (thumbnailUrl) {
            const thumbnailPath = `${user.id}/thumbnails/thumbnail_${timestamp}.jpg`;
            await supabase.storage.from('videos').remove([thumbnailPath]);
          }
          throw new Error(`Ошибка сохранения видео: ${dbError.message}`);
        }

        if (onProgress) onProgress(90); // 90% after database record

        console.log('✅ Видео создано успешно:', videoData);
        
        // Начисляем баллы за загрузку видео
        console.log('💰 Начисляем 10 баллов за загрузку видео...');
        try {
          const { error: pointsError } = await supabase.rpc('update_user_points', {
            p_user_id: user.id,
            p_points_change: 10,
            p_description: 'Загрузка видео'
          });

          if (pointsError) {
            console.error('❌ Ошибка при начислении баллов:', pointsError);
          } else {
            console.log('✅ Баллы начислены успешно');
          }
        } catch (pointsError) {
          console.error('❌ Ошибка начисления баллов:', pointsError);
        }

        // Обновляем достижения за загрузку видео
        console.log('🏆 Запускаем обновление достижений за загрузку видео...');
        try {
          const { error: videoAchievementError } = await supabase.rpc('update_achievement_progress', {
            p_user_id: user.id,
            p_category: 'videos',
            p_new_value: null,
            p_increment: 1
          });

          if (videoAchievementError) {
            console.error('❌ Ошибка обновления достижений за видео:', videoAchievementError);
          } else {
            console.log('✅ Достижения за видео обновлены');
          }

          // Проверяем временные достижения
          const now = new Date();
          const hour = now.getHours();
          
          if (hour < 8 || hour >= 22) {
            console.log('🌅🌙 Обновляем временные достижения...');
            const { error: timeAchievementError } = await supabase.rpc('update_achievement_progress', {
              p_user_id: user.id,
              p_category: 'time',
              p_new_value: null,
              p_increment: 1
            });
            
            if (timeAchievementError) {
              console.error('❌ Ошибка обновления временных достижений:', timeAchievementError);
            }
          }
        } catch (achievementError) {
          console.error('❌ Ошибка обновления достижений:', achievementError);
        }

        if (onProgress) onProgress(100); // 100% complete

        return videoData;
      } catch (error) {
        console.error('❌ Общая ошибка загрузки:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('🔄 Видео загружено успешно, обновляем кэш...');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      
      toast.success('Видео успешно загружено!');
    },
    onError: (error: any) => {
      console.error('❌ Ошибка загрузки видео:', error);
      toast.error(error.message || 'Ошибка загрузки видео');
    },
  });
};
