
import React, { lazy, Suspense } from 'react';
import VideoCardSkeleton from './VideoCardSkeleton';

const VideoCard = lazy(() => import('./VideoCard'));

interface LazyVideoCardProps {
  video: any;
  onLike: (id: string) => void;
}

const LazyVideoCard: React.FC<LazyVideoCardProps> = ({ video, onLike }) => {
  return (
    <Suspense fallback={<VideoCardSkeleton />}>
      <VideoCard video={video} onLike={onLike} />
    </Suspense>
  );
};

export default LazyVideoCard;
