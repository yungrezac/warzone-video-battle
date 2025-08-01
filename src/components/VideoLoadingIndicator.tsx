
import React from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoLoadingIndicatorProps {
  isLoading: boolean;
  hasError: boolean;
  loadProgress: number;
  onRetry: () => void;
}

const VideoLoadingIndicator: React.FC<VideoLoadingIndicatorProps> = ({
  isLoading,
  hasError,
  loadProgress,
  onRetry
}) => {
  if (hasError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 text-white">
        <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
        <p className="text-sm text-center mb-4">Ошибка загрузки видео</p>
        <Button 
          onClick={onRetry} 
          variant="outline" 
          size="sm"
          className="text-white border-white hover:bg-white hover:text-black"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Повторить
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <div className="text-xs mb-2">Загрузка видео...</div>
        {loadProgress > 0 && (
          <div className="w-32 bg-gray-700 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default VideoLoadingIndicator;
