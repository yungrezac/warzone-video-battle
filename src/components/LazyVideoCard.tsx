
import React, { lazy, Suspense } from 'react';
import VideoCardSkeleton from './VideoCardSkeleton';

const VideoCard = lazy(() => import('./VideoCard'));

interface LazyVideoCardProps {
  video: any;
  onVideoSelect?: (video: any) => void;
}

const LazyVideoCard: React.FC<LazyVideoCardProps> = ({ video, onVideoSelect }) => {
  return (
    <Suspense fallback={<VideoCardSkeleton />}>
      <VideoCard video={video} onVideoSelect={onVideoSelect} />
    </Suspense>
  );
};

export default LazyVideoCard;
