
import React from 'react';
import { Loader2 } from 'lucide-react';

const FullScreenLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Загрузка приложения...</p>
      </div>
    </div>
  );
};

export default FullScreenLoader;
