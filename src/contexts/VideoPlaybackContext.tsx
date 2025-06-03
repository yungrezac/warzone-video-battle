
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VideoPlaybackContextType {
  currentPlayingVideo: string | null;
  setCurrentPlayingVideo: (videoId: string | null) => void;
}

const VideoPlaybackContext = createContext<VideoPlaybackContextType | undefined>(undefined);

export const VideoPlaybackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<string | null>(null);

  return (
    <VideoPlaybackContext.Provider value={{ currentPlayingVideo, setCurrentPlayingVideo }}>
      {children}
    </VideoPlaybackContext.Provider>
  );
};

export const useVideoPlayback = () => {
  const context = useContext(VideoPlaybackContext);
  if (context === undefined) {
    throw new Error('useVideoPlayback must be used within a VideoPlaybackProvider');
  }
  return context;
};
