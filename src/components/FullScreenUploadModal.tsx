
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Video, X, Edit, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useOptimizedVideoUpload } from '@/hooks/useOptimizedVideoUpload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthWrapper';
import CategorySelector from './CategorySelector';
import VideoEditor from './VideoEditor';
import { shouldCompress } from '@/utils/videoOptimization';

interface FullScreenUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFile: File;
}

const FullScreenUploadModal: React.FC<FullScreenUploadModalProps> = ({ isOpen, onClose, initialFile }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Rollers' | 'BMX' | 'Skateboard'>('Rollers');
  const [showEditor, setShowEditor] = useState(false);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailTime, setThumbnailTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailGenerated, setThumbnailGenerated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useOptimizedVideoUpload();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (initialFile) {
      if (!initialFile.type.startsWith('video/')) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, выберите видео файл",
          variant: "destructive",
        });
        onClose();
        return;
      }

      if (initialFile.size > 50 * 1024 * 1024) {
        toast({
          title: "Файл слишком большой",
          description: "Размер файла не должен превышать 50MB. Сожмите видео в любом видеоредакторе.",
          variant: "destructive",
        });
        onClose();
        return;
      }

      setSelectedFile(initialFile);
      // Сброс всех состояний при выборе нового файла
      setTitle('');
      setDescription('');
      setCategory('Rollers');
      setShowEditor(false);
      setThumbnailBlob(null);
      setTrimStart(0);
      setTrimEnd(0);
      setUploadProgress(0);
      setThumbnailGenerated(false);
      setPreviewUrl(null);

      generatePreviewFromVideo(initialFile).then(preview => {
        setPreviewUrl(preview);
        setThumbnailGenerated(true);
        console.log('✅ Превью для отображения создано');
      }).catch(error => {
        console.warn('⚠️ Не удалось создать превью для отображения:', error);
        setPreviewUrl(null);
      });
    }
  }, [initialFile, onClose, toast]);

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
    if (!file) {
      return;
    }

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
    
    // Этот код вызывается, когда пользователь меняет файл уже внутри модального окна
    setSelectedFile(file);
    setShowEditor(false);
    setThumbnailBlob(null);
    setTrimStart(0);
    setTrimEnd(0);
    setUploadProgress(0);
    setThumbnailGenerated(false);

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

  const handleThumbnailSelect = (blob: Blob, time: number) => {
    setThumbnailBlob(blob);
    setThumbnailTime(time);
  };

  const handleVideoTrim = (startTime: number, endTime: number) => {
    setTrimStart(startTime);
    setTrimEnd(endTime);
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
      console.log('🎬 Начинаем загрузку видео:', {
        userId: user.id,
        username: user.username || user.first_name,
        title: title.trim(),
        category: category,
        fileSize: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`
      });
      
      await uploadMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        videoFile: selectedFile,
        category: category,
        onProgress: setUploadProgress,
      });

      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setCategory('Rollers');
      setShowEditor(false);
      setThumbnailBlob(null);
      setUploadProgress(0);
      setPreviewUrl(null);
      setThumbnailGenerated(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Успешно!",
        description: "Видео загружено и появится в ленте",
      });
      
      onClose();
    } catch (error) {
      console.error('❌ Ошибка загрузки для пользователя:', user.id, error);
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
    onClose();
  };

  const isUploading = uploadMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full h-full max-w-none max-h-none m-0 p-0 rounded-none" hideCloseButton>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-4 flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/20 mr-3 p-2"
              disabled={isUploading}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Загрузить трюк</h1>
              <p className="opacity-90 text-sm">Поделитесь своим лучшим трюком!</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-md mx-auto space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center flex justify-center items-center h-48">
                  <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-3">
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
                        <div className="flex gap-1">
                           <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleButtonClick}
                            className="text-blue-600"
                            title="Изменить файл"
                            disabled={isUploading}
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowEditor(!showEditor)}
                            className="text-blue-600"
                             title="Редактировать"
                            disabled={isUploading}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={removeFile} disabled={isUploading} title="Отменить">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
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

                    {showEditor && !isUploading && (
                      <div className="border border-gray-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold mb-2">Редактор видео</h4>
                        <VideoEditor
                          videoFile={selectedFile}
                          onThumbnailSelect={handleThumbnailSelect}
                          onVideoTrim={handleVideoTrim}
                        />
                      </div>
                    )}

                    {thumbnailBlob && (
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="text-xs text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Превью выбрано
                        </p>
                      </div>
                    )}

                    {(trimStart > 0 || trimEnd > 0) && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-xs text-blue-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Обрезка настроена
                        </p>
                      </div>
                    )}
                  </div>

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
                      rows={3}
                      disabled={isUploading}
                      maxLength={500}
                    />
                  </div>

                  {isUploading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">Загрузка видео...</span>
                        <span className="text-sm text-blue-600">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                      <p className="text-xs text-blue-600 mt-1">
                        {uploadProgress < 50 ? 'Загружаем видео...' :
                         uploadProgress < 75 ? 'Загружаем превью...' :
                         uploadProgress < 90 ? 'Сохраняем в базу данных...' :
                         uploadProgress < 100 ? 'Обновляем достижения...' : 'Готово!'}
                      </p>
                    </div>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Правила загрузки:</h4>
                    <ul className="text-xs text-yellow-700 space-y-0.5">
                      <li>• Максимальный размер файла: 50MB</li>
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
                        Загрузка... {uploadProgress}%
                      </>
                    ) : (
                      'Загрузить трюк'
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullScreenUploadModal;
