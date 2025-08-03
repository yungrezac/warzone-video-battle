
import React, { useState, useRef, useEffect } from 'react';
import VideoCard from './VideoCard';

interface Video {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  thumbnail: string;
  videoUrl?: string;
  likes: number;
  comments: number;
  views: number;
  isWinner?: boolean;
  timestamp: string;
  userLiked?: boolean;
  userId?: string;
  category?: 'Rollers' | 'BMX' | 'Skateboard';
  authorIsPremium?: boolean;
}

interface LazyVideoCardProps {
  video: Video;
  onLike: (id: string) => void;
  onUserClick?: () => void;
}

const LazyVideoCard: React.FC<LazyVideoCardProps> = ({ video, onLike, onUserClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-h-[400px]">
      {isVisible ? (
        <VideoCard 
          video={video} 
          onLike={onLike}
          onUserClick={onUserClick}
        />
      ) : (
        <div className="bg-gray-200 animate-pulse rounded-lg h-[400px]" />
      )}
    </div>
  );
};

export default LazyVideoCard;
