
import React, { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { useSkeletonStorage } from '@/hooks/useSkeletonStorage';

const VideoCardSkeleton: React.FC = () => {
  const { loadSkeletonData } = useSkeletonStorage();
  const [skeletonData, setSkeletonData] = useState<any>(null);

  useEffect(() => {
    // Загружаем сохраненные данные скелетона
    loadSkeletonData('video_skeleton').then(data => {
      if (data) {
        setSkeletonData(data.data);
        console.log('🦴 Скелетон видео загружен из локального хранения');
      }
    });
  }, [loadSkeletonData]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
      {/* Превью видео */}
      <div className="relative">
        <Skeleton className="w-full h-48 rounded-lg" />
        <div className="absolute bottom-2 right-2">
          <Skeleton className="w-12 h-5 rounded" />
        </div>
      </div>

      {/* Информация об авторе */}
      <div className="flex items-center space-x-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1">
          <div className="text-sm text-gray-500">
            {skeletonData?.author || 'Загрузка...'}
          </div>
        </div>
      </div>

      {/* Заголовок */}
      <div>
        <div className="text-sm font-medium text-gray-900 mb-1">
          {skeletonData?.title || 'Загрузка видео...'}
        </div>
        <Skeleton className="w-3/4 h-4" />
      </div>

      {/* Статистика */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>👀 {skeletonData?.views || '---'}</span>
          <span>❤️ {skeletonData?.likes || '---'}</span>
          <span>💬 {skeletonData?.comments || '---'}</span>
        </div>
        <span>{skeletonData?.duration || '00:00'}</span>
      </div>
    </div>
  );
};

export default VideoCardSkeleton;
