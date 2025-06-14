
import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOptimizedVideoViews = () => {
  const queryClient = useQueryClient();
  const pendingViews = useRef<Set<string>>(new Set());
  const batchTimer = useRef<NodeJS.Timeout | null>(null);

  const processBatch = useCallback(async () => {
    if (pendingViews.current.size === 0) return;

    const videoIds = Array.from(pendingViews.current);
    pendingViews.current.clear();

    try {
      console.log('📊 Батчевое обновление просмотров:', videoIds.length);
      
      // Батчевое обновление просмотров
      for (const videoId of videoIds) {
        const { data: currentVideo } = await supabase
          .from('videos')
          .select('views')
          .eq('id', videoId)
          .single();

        if (currentVideo) {
          await supabase
            .from('videos')
            .update({ views: (currentVideo.views || 0) + 1 })
            .eq('id', videoId);
        }
      }

      // Инвалидируем кэши
      queryClient.invalidateQueries({ queryKey: ['optimized-videos'] });
      queryClient.invalidateQueries({ queryKey: ['optimized-user-videos'] });
      
    } catch (error) {
      console.error('Ошибка батчевого обновления просмотров:', error);
    }
  }, [queryClient]);

  const markVideoAsViewed = useCallback((videoId: string) => {
    pendingViews.current.add(videoId);

    // Очищаем предыдущий таймер
    if (batchTimer.current) {
      clearTimeout(batchTimer.current);
    }

    // Устанавливаем новый таймер для батчевой обработки
    batchTimer.current = setTimeout(processBatch, 2000); // 2 секунды
  }, [processBatch]);

  return { markVideoAsViewed };
};
