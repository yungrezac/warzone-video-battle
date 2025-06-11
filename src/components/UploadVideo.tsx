
import React, { useState, useRef } from 'react';
import { Upload, Video, X, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useOptimizedVideoUpload } from '@/hooks/useOptimizedVideoUpload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthWrapper';
import CategorySelector from './CategorySelector';
import { shouldCompress } from '@/utils/videoOptimization';

const UploadVideo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Rollers' | 'BMX' | 'Skateboard'>('Rollers');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailGenerated, setThumbnailGenerated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useOptimizedVideoUpload();
  const { toast } = useToast();
  const { user } = useAuth();

  // Функция для генерации превью локально для отображения
  const generatePreviewFromVideo = (videoFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Не удалось создать canvas context'));
        return;
      }

      video.preload = 'metadata';
      video.muted = true;
      
      video.onloadedmetadata = () => {
        const time = Math.min(1, video.duration / 2);
        video.currentTime = time;
      };
      
      video.onseeked = () => {
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve(url);
            } else {
              reject(new Error('Не удалось создать превью'));
            }
          }, 'image/jpeg', 0.8);
        } catch (error) {
          reject(error);
        }
      };
      
      video.onerror = () => {
        reject(new Error('Ошибка загрузки видео для генерации превью'));
      };
      
      const videoUrl = URL.createObjectURL(videoFile);
      video.src = videoUrl;
      
      video.onloadstart = () => {
        URL.revokeObjectURL(videoUrl);
      };
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите видео файл",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Файл слишком большой",
        description: "Размер файла не должен превышать 50MB. Сожмите видео в любом видеоредакторе.",
        variant: "destructive",
      });
      return;
    }

    console.log('📁 Файл выбран:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
      willCompress: shouldCompress(file),
      userId: user?.id
    });

    setSelectedFile(file);
    setThumbnailGenerated(false);
    
    // Генерируем превью для отображения
    try {
      const preview = await generatePreviewFromVideo(file);
      setPreviewUrl(preview);
      setThumbnailGenerated(true);
      console.log('✅ Превью для отображения создано');
    } catch (error) {
      console.warn('⚠️ Не удалось создать превью для отображения:', error);
      setPreviewUrl(null);
    }
  };

  const handleButtonClick = () => {
    if (!user) {
      toast({
        title: "Необходима авторизация",
        description: "Войдите в систему для загрузки видео",
        variant: "destructive",
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!user) {
      toast({
        title: "Необходима авторизация",
        description: "Войдите в систему для загрузки видео",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile || !title.trim()) {
      toast({
        title: "Заполните данные",
        description: "Выберите файл и введите название",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('🚀 Начинаем оптимизированную загрузку видео:', {
        userId: user.id,
        username: user.username || user.first_name,
        title: title.trim(),
        category: category,
        fileSize: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
        willCompress: shouldCompress(selectedFile)
      });
      
      await uploadMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        videoFile: selectedFile,
        category: category,
        onProgress: setUploadProgress,
      });

      // Очищаем форму
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setCategory('Rollers');
      setUploadProgress(0);
      setPreviewUrl(null);
      setThumbnailGenerated(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Успешно!",
        description: "Видео загружено быстро и появится в ленте. Превью создано автоматически.",
      });
    } catch (error) {
      console.error('❌ Ошибка оптимизированной загрузки для пользователя:', user.id, error);
      setUploadProgress(0);
      
      let errorMessage = 'Попробуйте еще раз';
      if (error instanceof Error) {
        if (error.message.includes('50MB') || error.message.includes('size')) {
          errorMessage = 'Файл слишком большой. Максимум: 50MB';
        } else if (error.message.includes('RLS') || error.message.includes('policy') || error.message.includes('авторизации')) {
          errorMessage = 'Ошибка авторизации. Перезайдите в приложение';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Ошибка загрузки",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setPreviewUrl(null);
    setThumbnailGenerated(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const isUploading = uploadMutation.isPending;

  return (
    <div className="p-3 pb-16">
      <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-4 rounded-lg mb-4">
        <h2 className="text-xl font-bold mb-1">Загрузить трюк</h2>
        <p className="opacity-90 text-sm">Поделитесь своим лучшим трюком и участвуйте в ежедневном соревновании!</p>
      </div>

      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">Требуется авторизация</h4>
            <p className="text-sm text-yellow-700">Войдите в систему через Telegram для загрузки видео</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {!selectedFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Выберите видео для загрузки
            </h3>
            <p className="text-gray-500 mb-3 text-sm">
              Поддерживаются форматы: MP4, MOV, AVI. Максимальный размер: <span className="font-semibold text-red-600">50MB</span>
            </p>
            <p className="text-green-600 mb-2 text-xs font-medium">
              ✨ Превью создается автоматически из первой секунды видео
            </p>
            <p className="text-blue-600 mb-3 text-xs font-medium">
              🚀 Автоматическое сжатие для быстрой загрузки
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <Button 
              onClick={handleButtonClick}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Выбрать файл
            </Button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Video className="w-6 h-6 text-blue-600 mr-2" />
                <div>
                  <p className="font-semibold text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {shouldCompress(selectedFile) && (
                    <p className="text-xs text-blue-600">
                      🗜️ Будет сжато для быстрой загрузки
                    </p>
                  )}
                  {thumbnailGenerated && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Превью создано автоматически
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={removeFile} disabled={isUploading}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Отображение сгенерированного превью */}
            {previewUrl && (
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-2">Автоматически созданное превью:</p>
                <div className="w-full max-w-xs mx-auto">
                  <img 
                    src={previewUrl} 
                    alt="Превью видео" 
                    className="w-full h-auto rounded border border-gray-200"
                    style={{ maxHeight: '150px', objectFit: 'cover' }}
                  />
                </div>
              </div>
            )}
            
            {isUploading && uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <CategorySelector 
            selectedCategory={category}
            onCategoryChange={setCategory}
            disabled={isUploading}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название трюка *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: 360 Spin, Backflip, Grind..."
              className="w-full"
              disabled={isUploading}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание (необязательно)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите о своем трюке..."
              className="w-full"
              rows={2}
              disabled={isUploading}
              maxLength={500}
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-semibold text-blue-800 mb-1 text-sm">🚀 Оптимизированная загрузка:</h4>
          <ul className="text-xs text-blue-700 space-y-0.5">
            <li>• Автоматическое сжатие больших файлов</li>
            <li>• Загрузка оптимизированными чанками</li>
            <li>• Автоматическое создание превью</li>
            <li>• Параллельная обработка файлов</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Правила загрузки:</h4>
          <ul className="text-xs text-yellow-700 space-y-0.5">
            <li>• Максимальный размер файла: 50MB</li>
            <li>• Превью создается автоматически из первой секунды</li>
            <li>• Видео проходит модерацию перед публикацией</li>
            <li>• Победитель определяется каждый день в 00:00</li>
            <li>• Запрещены опасные трюки без защитной экипировки</li>
          </ul>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !title.trim() || isUploading || !user}
          className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {uploadProgress < 15 ? 'Подготовка...' :
               uploadProgress < 25 ? 'Сжатие видео...' :
               uploadProgress < 75 ? 'Загрузка...' :
               uploadProgress < 85 ? 'Создание превью...' :
               uploadProgress < 95 ? 'Сохранение...' :
               'Завершение...'} {uploadProgress}%
            </>
          ) : (
            '🚀 Загрузить трюк (быстро)'
          )}
        </Button>
      </div>
    </div>
  );
};

export default UploadVideo;
