
import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Video, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useOptimizedVideoUpload } from '@/hooks/useOptimizedVideoUpload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthWrapper';

const MinimalUploadForm: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadMutation = useOptimizedVideoUpload();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setShowModal(true);
  };

  const generateThumbnail = (time: number) => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    video.currentTime = time;
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const thumbnailUrl = URL.createObjectURL(blob);
          setSelectedThumbnail(thumbnailUrl);
          setThumbnailBlob(blob);
        }
      }, 'image/jpeg', 0.8);
    };
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      await uploadMutation.mutateAsync({
        title: title.trim() || 'Без названия',
        videoFile: selectedFile,
        category: 'Rollers',
        thumbnailBlob: thumbnailBlob || undefined,
        onProgress: setUploadProgress,
      });

      // Очистка
      setSelectedFile(null);
      setTitle('');
      setUploadProgress(0);
      setShowModal(false);
      setVideoUrl(null);
      setSelectedThumbnail(null);
      setThumbnailBlob(null);
      
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

  const closeModal = () => {
    setShowModal(false);
    setSelectedFile(null);
    setVideoUrl(null);
    setSelectedThumbnail(null);
    setThumbnailBlob(null);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    if (selectedThumbnail) {
      URL.revokeObjectURL(selectedThumbnail);
    }
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
    <>
      <div className="p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="mb-4">
            <Video className="w-16 h-16 text-blue-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Загрузить трюк</h2>
            <p className="text-sm text-gray-600">Выберите видео из галереи</p>
          </div>
          
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
            className="w-full bg-blue-600 hover:bg-blue-700 py-3"
            size="lg"
          >
            <Upload className="w-5 h-5 mr-2" />
            Выбрать видео
          </Button>
        </div>
      </div>

      {/* Модальное окно для настройки видео */}
      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-sm mx-auto" hideCloseButton>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Настройка видео</h3>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {videoUrl && (
              <div className="space-y-4">
                {/* Видео для предварительного просмотра */}
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full rounded-lg"
                    controls
                    style={{ maxHeight: '200px' }}
                    onLoadedMetadata={() => {
                      // Автоматически генерируем превью с 1 секунды
                      setTimeout(() => generateThumbnail(1), 100);
                    }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Показываем выбранное превью */}
                {selectedThumbnail && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Превью кадр:</p>
                    <img 
                      src={selectedThumbnail} 
                      alt="Превью" 
                      className="w-full rounded border"
                      style={{ maxHeight: '120px', objectFit: 'cover' }}
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => generateThumbnail(0.5)}
                        className="flex-1"
                      >
                        Начало
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const video = videoRef.current;
                          if (video) generateThumbnail(video.duration / 2);
                        }}
                        className="flex-1"
                      >
                        Середина
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const video = videoRef.current;
                          if (video) generateThumbnail(video.duration - 1);
                        }}
                        className="flex-1"
                      >
                        Конец
                      </Button>
                    </div>
                  </div>
                )}

                {/* Поле для названия */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название (необязательно)
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: 360 Spin, Backflip..."
                    disabled={isUploading}
                  />
                </div>

                {/* Прогресс загрузки */}
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

                {/* Кнопка загрузки */}
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Загружаем...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Загрузить трюк
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MinimalUploadForm;
