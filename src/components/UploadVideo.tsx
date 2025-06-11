
import React, { useState, useRef } from 'react';
import { Upload, Video, X, AlertCircle, Loader2, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useOptimizedVideoUpload } from '@/hooks/useOptimizedVideoUpload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthWrapper';
import CategorySelector from './CategorySelector';
import { shouldCompress, generateQuickThumbnail } from '@/utils/videoOptimization';

const UploadVideo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Rollers' | 'BMX' | 'Skateboard'>('Rollers');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailGenerated, setThumbnailGenerated] = useState(false);
  const [compressionEstimate, setCompressionEstimate] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useOptimizedVideoUpload();
  const { toast } = useToast();
  const { user } = useAuth();

  // Быстрая генерация превью для отображения
  const generatePreviewFromVideo = async (videoFile: File): Promise<string> => {
    try {
      const thumbnailBlob = await generateQuickThumbnail(videoFile);
      const url = URL.createObjectURL(thumbnailBlob);
      return url;
    } catch (error) {
      throw new Error('Не удалось создать превью');
    }
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

    console.log('⚡ Файл выбран для экстремальной загрузки:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
      willCompress: shouldCompress(file),
      userId: user?.id
    });

    setSelectedFile(file);
    setThumbnailGenerated(false);
    setPreviewUrl(null);
    
    // Показываем оценку сжатия
    if (shouldCompress(file)) {
      const estimatedSize = (file.size * 0.3 / 1024 / 1024).toFixed(1);
      setCompressionEstimate(`Файл будет сжат до ~${estimatedSize}MB`);
    } else {
      setCompressionEstimate('');
    }
    
    // Быстро генерируем превью
    try {
      const preview = await generatePreviewFromVideo(file);
      setPreviewUrl(preview);
      setThumbnailGenerated(true);
      console.log('⚡ Превью создано мгновенно');
    } catch (error) {
      console.warn('⚠️ Не удалось создать превью:', error);
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
      console.log('⚡ Начинаем экстремально быструю загрузку:', {
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
      setCompressionEstimate('');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "⚡ Мгновенная загрузка!",
        description: "Видео загружено на максимальной скорости и появится в ленте",
      });
    } catch (error) {
      console.error('❌ Ошибка экстремальной загрузки:', error);
      setUploadProgress(0);
      
      let errorMessage = 'Попробуйте еще раз';
      if (error instanceof Error) {
        if (error.message.includes('50MB') || error.message.includes('size')) {
          errorMessage = 'Файл слишком большой. Максимум: 50MB';
        } else if (error.message.includes('RLS') || error.message.includes('policy')) {
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
    setCompressionEstimate('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const isUploading = uploadMutation.isPending;

  return (
    <div className="p-3 pb-16">
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-4 rounded-lg mb-4">
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Экстремальная загрузка трюка
        </h2>
        <p className="opacity-90 text-sm">Загружайте видео на максимальной скорости с автоматическим сжатием!</p>
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
          <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center bg-gradient-to-br from-purple-50 to-pink-50">
            <Upload className="w-10 h-10 text-purple-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Выберите видео для экстремальной загрузки
            </h3>
            <p className="text-gray-500 mb-3 text-sm">
              Поддерживаются форматы: MP4, MOV, AVI. Максимальный размер: <span className="font-semibold text-red-600">50MB</span>
            </p>
            <div className="bg-purple-100 border border-purple-200 rounded-lg p-3 mb-3">
              <h4 className="font-semibold text-purple-800 mb-1 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Технологии максимальной скорости:
              </h4>
              <ul className="text-xs text-purple-700 space-y-0.5">
                <li>• Автоматическое сжатие до 480p для ускорения</li>
                <li>• Параллельная обработка видео и превью</li>
                <li>• Оптимизированные чанки загрузки</li>
                <li>• Мгновенное создание превью (0.1 сек)</li>
                <li>• Сжатие до 70% от исходного размера</li>
              </ul>
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
              onClick={handleButtonClick}
              disabled={isUploading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Выбрать файл
            </Button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Video className="w-6 h-6 text-purple-600 mr-2" />
                <div>
                  <p className="font-semibold text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {compressionEstimate && (
                    <p className="text-xs text-purple-600 font-medium">
                      ⚡ {compressionEstimate}
                    </p>
                  )}
                  {thumbnailGenerated && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Превью создано мгновенно
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
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300 flex items-center justify-center" 
                  style={{ width: `${uploadProgress}%` }}
                >
                  <span className="text-xs text-white font-bold">{uploadProgress}%</span>
                </div>
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

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <h4 className="font-semibold text-purple-800 mb-1 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Экстремальная оптимизация:
          </h4>
          <ul className="text-xs text-purple-700 space-y-0.5">
            <li>• Автоматическое сжатие больших файлов до 480p</li>
            <li>• Параллельная загрузка видео и превью</li>
            <li>• Оптимизированные чанки по 2MB</li>
            <li>• Битрейт максимум 500kbps для скорости</li>
            <li>• Асинхронное обновление достижений</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Правила загрузки:</h4>
          <ul className="text-xs text-yellow-700 space-y-0.5">
            <li>• Максимальный размер файла: 50MB</li>
            <li>• Превью создается автоматически за 0.1 секунды</li>
            <li>• Видео проходит модерацию перед публикацией</li>
            <li>• Победитель определяется каждый день в 00:00</li>
            <li>• Запрещены опасные трюки без защитной экипировки</li>
          </ul>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !title.trim() || isUploading || !user}
          className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white font-bold py-3"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {uploadProgress < 10 ? 'Подготовка...' :
               uploadProgress < 20 ? 'Сжатие видео...' :
               uploadProgress < 80 ? 'Экстремальная загрузка...' :
               uploadProgress < 95 ? 'Создание превью...' :
               'Завершение...'} {uploadProgress}%
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              ⚡ Экстремальная загрузка трюка
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UploadVideo;
