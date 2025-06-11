
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoData {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  user_id: string;
  category: string;
  likes_count: number;
  comments_count: number;
  average_rating: number;
  views: number;
  is_winner: boolean;
  created_at: string;
  user_liked?: boolean;
  user_rating?: number;
  user?: {
    id: string;
    username?: string;
    first_name?: string;
    avatar_url?: string;
    telegram_username?: string;
  };
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
  return useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          user:profiles (
            id,
            username,
            first_name,
            avatar_url,
            telegram_username
          ),
          video_likes (user_id),
          video_ratings (user_id, rating),
          video_comments (id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка при загрузке видео:', error);
        throw new Error(`Ошибка при загрузке видео: ${error.message}`);
      }

      // Получаем текущего пользователя из localStorage
      const savedUser = localStorage.getItem('roller_tricks_user');
      const user = savedUser ? JSON.parse(savedUser) : null;

      const videosWithLikes = data.map((video) => {
        const user_liked = video.video_likes.some((like) => like.user_id === user?.id);
        const userRating = video.video_ratings.find((rating) => rating.user_id === user?.id);

        return {
          ...video,
          user_liked,
          user_rating: userRating?.rating || 0,
          comments_count: video.video_comments?.length || 0,
        };
      });

      return videosWithLikes;
    },
  });
};

export const useUploadVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UploadVideoParams) => {
      const { title, description, videoFile, category, thumbnailBlob, onProgress } = params;
      
      console.log('🎬 Начинаем загрузку видео:', {
        title,
        category,
        fileSize: `${(videoFile.size / 1024 / 1024).toFixed(2)}MB`
      });

      // Получаем текущего пользователя из локального хранилища
      const savedUser = localStorage.getItem('roller_tricks_user');
      if (!savedUser) {
        throw new Error('Пользователь не авторизован');
      }

      const user = JSON.parse(savedUser);
      if (!user.id) {
        throw new Error('Отсутствует ID пользователя');
      }

      console.log('👤 Пользователь для загрузки:', user.id);

      // Создаем уникальный путь для файла
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log('📁 Путь файла:', fileName);

      onProgress?.(10);

      // Загружаем видео в storage
      console.log('⬆️ Загружаем видео в storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile);

      if (uploadError) {
        console.error('❌ Ошибка загрузки видео:', uploadError);
        throw new Error(`Ошибка загрузки видео: ${uploadError.message}`);
      }

      console.log('✅ Видео загружено в storage:', uploadData.path);
      onProgress?.(50);

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(uploadData.path);

      const videoUrl = urlData.publicUrl;
      console.log('🔗 Публичный URL видео:', videoUrl);

      onProgress?.(70);

      // Обрабатываем thumbnail
      let thumbnailUrl: string | undefined;
      if (thumbnailBlob) {
        const thumbnailFileName = `${user.id}/thumbnails/${Date.now()}.jpg`;
        
        console.log('🖼️ Загружаем thumbnail...');
        const { data: thumbnailData, error: thumbnailError } = await supabase.storage
          .from('videos')
          .upload(thumbnailFileName, thumbnailBlob);

        if (!thumbnailError && thumbnailData) {
          const { data: thumbnailUrlData } = supabase.storage
            .from('videos')
            .getPublicUrl(thumbnailData.path);
          thumbnailUrl = thumbnailUrlData.publicUrl;
          console.log('✅ Thumbnail загружен:', thumbnailUrl);
        }
      }

      onProgress?.(80);

      // Сохраняем запись в базу данных
      console.log('💾 Сохраняем запись в базу данных...');
      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert({
          title,
          description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          user_id: user.id, // Используем ID из локального хранилища
          category,
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Ошибка сохранения в БД:', dbError);
        
        // Пытаемся удалить загруженный файл при ошибке
        await supabase.storage.from('videos').remove([uploadData.path]);
        if (thumbnailUrl) {
          await supabase.storage.from('videos').remove([`${user.id}/thumbnails/${Date.now()}.jpg`]);
        }
        
        throw new Error(`Ошибка сохранения видео: ${dbError.message}`);
      }

      console.log('✅ Видео успешно сохранено:', videoData.id);
      onProgress?.(100);

      return videoData;
    },
    onSuccess: () => {
      console.log('🎉 Загрузка завершена успешно');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Видео успешно загружено!');
    },
    onError: (error: Error) => {
      console.error('❌ Ошибка загрузки видео:', error);
      toast.error(`Ошибка загрузки: ${error.message}`);
    },
  });
};

export const useLikeVideo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      console.log('💖 useLikeVideo mutationFn вызвана:', { videoId, isLiked });
      
      // Получаем пользователя из локального хранилища
      const savedUser = localStorage.getItem('roller_tricks_user');
      if (!savedUser) {
        throw new Error('Пользователь не авторизован');
      }

      const user = JSON.parse(savedUser);
      if (!user.id) {
        throw new Error('Отсутствует ID пользователя');
      }

      if (isLiked) {
        // Убираем лайк
        console.log('➖ Убираем лайк...');
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Обновляем счетчик вручную
        const { data: currentVideo } = await supabase
          .from('videos')
          .select('likes_count')
          .eq('id', videoId)
          .single();
        
        if (currentVideo) {
          const { error: updateError } = await supabase
            .from('videos')
            .update({ likes_count: Math.max(0, (currentVideo.likes_count || 0) - 1) })
            .eq('id', videoId);
          
          if (updateError) throw updateError;
        }
      } else {
        // Ставим лайк
        console.log('➕ Ставим лайк...');
        const { error } = await supabase
          .from('video_likes')
          .insert({ video_id: videoId, user_id: user.id });
        
        if (error) throw error;
        
        // Обновляем счетчик вручную
        const { data: currentVideo } = await supabase
          .from('videos')
          .select('likes_count')
          .eq('id', videoId)
          .single();
        
        if (currentVideo) {
          const { error: updateError } = await supabase
            .from('videos')
            .update({ likes_count: (currentVideo.likes_count || 0) + 1 })
            .eq('id', videoId);
          
          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      console.error('❌ Ошибка обработки лайка:', error);
    },
  });
};

export const useRateVideo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ videoId, rating }: { videoId: string; rating: number }) => {
      console.log('⭐ useRateVideo mutationFn вызвана:', { videoId, rating });
      
      // Получаем пользователя из локального хранилища
      const savedUser = localStorage.getItem('roller_tricks_user');
      if (!savedUser) {
        throw new Error('Пользователь не авторизован');
      }

      const user = JSON.parse(savedUser);
      if (!user.id) {
        throw new Error('Отсутствует ID пользователя');
      }

      // Проверяем существующую оценку
      const { data: existingRating } = await supabase
        .from('video_ratings')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRating) {
        // Обновляем существующую оценку
        const { error } = await supabase
          .from('video_ratings')
          .update({ rating })
          .eq('id', existingRating.id);
        
        if (error) throw error;
      } else {
        // Создаем новую оценку
        const { error } = await supabase
          .from('video_ratings')
          .insert({ video_id: videoId, user_id: user.id, rating });
        
        if (error) throw error;
      }

      // Пересчитываем средний рейтинг
      const { data: avgData } = await supabase
        .from('video_ratings')
        .select('rating')
        .eq('video_id', videoId);

      if (avgData && avgData.length > 0) {
        const avgRating = avgData.reduce((sum, r) => sum + r.rating, 0) / avgData.length;
        
        await supabase
          .from('videos')
          .update({ average_rating: avgRating })
          .eq('id', videoId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      console.error('❌ Ошибка выставления оценки:', error);
    },
  });
};
