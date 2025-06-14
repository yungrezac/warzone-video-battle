
import React from 'react';
import VirtualizedVideoFeed from './VirtualizedVideoFeed';

// Простая обертка для обратной совместимости
const VideoFeed: React.FC = () => {
  return <VirtualizedVideoFeed />;
};

export default VideoFeed;
