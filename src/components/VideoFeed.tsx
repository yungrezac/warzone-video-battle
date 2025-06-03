
import React, { useState, useEffect } from 'react';
import VideoCard from './VideoCard';

const VideoFeed: React.FC = () => {
  const [videos, setVideos] = useState([
    {
      id: '1',
      title: 'Эпический геймплей в Warzone',
      author: 'ProGamer123',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
      likes: 234,
      comments: 45,
      rating: 4.7,
      views: 1250,
      isWinner: true,
      timestamp: '2 часа назад'
    },
    {
      id: '2',
      title: 'Невероятная победа в соло',
      author: 'WarriorKing',
      authorAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
      likes: 189,
      comments: 32,
      rating: 4.3,
      views: 890,
      timestamp: '4 часа назад'
    },
    {
      id: '3',
      title: 'Команда мечты в действии',
      author: 'TeamPlayer',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b8fb?w=100&h=100&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400&h=300&fit=crop',
      likes: 156,
      comments: 28,
      rating: 4.1,
      views: 672,
      timestamp: '6 часов назад'
    }
  ]);

  const handleLike = (videoId: string) => {
    setVideos(prev => prev.map(video => 
      video.id === videoId 
        ? { ...video, likes: video.likes + 1 }
        : video
    ));
  };

  const handleComment = (videoId: string) => {
    console.log(`Opening comments for video ${videoId}`);
    // TODO: Implement comment modal
  };

  const handleRate = (videoId: string, rating: number) => {
    console.log(`Rating video ${videoId} with ${rating} stars`);
    // TODO: Implement rating system
  };

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-4 m-4 rounded-lg">
        <h2 className="text-lg font-bold mb-2">🔥 Горячее сегодня</h2>
        <p className="text-sm opacity-90">
          Голосование закончится в 23:59. Победитель получит баллы равные количеству оценок!
        </p>
      </div>

      <div className="px-4">
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            onLike={handleLike}
            onComment={handleComment}
            onRate={handleRate}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoFeed;
