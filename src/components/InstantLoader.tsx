
import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const InstantLoader: React.FC = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const preloadCriticalData = async () => {
      console.log('⚡ Мгновенная предзагрузка критических данных...');
      
      // Предзагружаем только самые важные данные
      try {
        const [videosResponse] = await Promise.all([
          supabase
            .from('videos')
            .select(`
              id,
              title,
              video_url,
              thumbnail_url,
              category,
              views,
              likes_count,
              comments_count,
              profiles!videos_user_id_fkey (
                id,
                username,
                first_name,
                avatar_url
              )
            `)
            .order('created_at', { ascending: false })
            .limit(10) // Только первые 10 видео для быстрого старта
        ]);

        if (videosResponse.data) {
          queryClient.setQueryData(['video-feed-optimized', 20], videosResponse.data);
          console.log('✅ Критические данные предзагружены');
        }
      } catch (error) {
        console.warn('⚠️ Ошибка предзагрузки (не критично):', error);
      }
    };

    preloadCriticalData();
  }, [queryClient]);

  return null;
};

export default InstantLoader;
