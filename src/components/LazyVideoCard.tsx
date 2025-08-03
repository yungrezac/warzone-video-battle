
import React, { lazy, Suspense } from 'react';
import VideoCardSkeleton from './VideoCardSkeleton';

const VideoCard = lazy(() => import('./VideoCard'));

interface LazyVideoCardProps {
  video: any;
}

const LazyVideoCard: React.FC<LazyVideoCardProps> = ({ video }) => {
  return (
    <Suspense fallback={<VideoCardSkeleton />}>
      <VideoCard video={video} />
    </Suspense>
  );
};

export default LazyVideoCard;
