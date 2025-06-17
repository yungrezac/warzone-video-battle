
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const VideoCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative">
        <AspectRatio ratio={9 / 16} className="bg-black">
          <Skeleton className="w-full h-full" />
        </AspectRatio>
      </div>

      <div className="p-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center flex-1 min-w-0">
            <Skeleton className="w-7 h-7 rounded-full mr-2" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-7 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCardSkeleton;
