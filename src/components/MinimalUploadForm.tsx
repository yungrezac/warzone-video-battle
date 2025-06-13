
import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOptimizedVideoUpload } from '@/hooks/useOptimizedVideoUpload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthWrapper';

const MinimalUploadForm: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useOptimizedVideoUpload();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Ошибка",
        description: "Выберите видео файл",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "Файл слишком большой",
        description: "Максимум 100MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      await uploadMutation.mutateAsync({
        title: title.trim() || 'Без названия',
        videoFile: selectedFile,
        category: 'Rollers',
        onProgress: setUploadProgress,
      });

      setSelectedFile(null);
      setTitle('');
      setUploadProgress(0);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Готово!",
        description: "Видео загружено",
      });
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setUploadProgress(0);
      
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить видео",
        variant: "destructive",
      });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const isUploading = uploadMutation.isPending;

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Войдите для загрузки видео</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      {!selectedFile ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Загрузить видео</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
            className="w-full"
          >
            Выбрать файл
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            {!isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название (необязательно)"
            disabled={isUploading}
            className="w-full"
          />

          {isUploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-500">
                Загрузка... {uploadProgress}%
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              'Загрузить'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MinimalUploadForm;
