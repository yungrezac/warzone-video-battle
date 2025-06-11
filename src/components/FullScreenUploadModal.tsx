
import React, { useState, useRef } from 'react';
import { Upload, Video, X, Edit, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useUploadVideo } from '@/hooks/useVideos';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthWrapper';
import CategorySelector from './CategorySelector';
import VideoEditor from './VideoEditor';

interface FullScreenUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FullScreenUploadModal: React.FC<FullScreenUploadModalProps> = ({ isOpen, onClose }) => {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadVideo();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFile(file);
    setShowEditor(false);
    setThumbnailBlob(null);
    setTrimStart(0);
    setTrimEnd(0);
    setUploadProgress(0);
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
        thumbnailBlob: thumbnailBlob || undefined,
        trimStart: trimStart > 0 ? trimStart : undefined,
        trimEnd: trimEnd > 0 ? trimEnd : undefined,
        onProgress: setUploadProgress,
      });

      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setCategory('Rollers');
      setShowEditor(false);
      setThumbnailBlob(null);
      setUploadProgress(0);
      
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
    setSelectedFile(null);
    setUploadProgress(0);
    setShowEditor(false);
    setThumbnailBlob(null);
  };

  const isUploading = uploadMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Выберите видео для загрузки
                  </h3>
                  <p className="text-gray-500 mb-3 text-sm">
                    Поддерживаются форматы: MP4, MOV, AVI. Максимальный размер: <span className="font-semibold text-red-600">50MB</span>
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
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowEditor(!showEditor)}
                          className="text-blue-600"
                          disabled={isUploading}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={removeFile} disabled={isUploading}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
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
              )}

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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullScreenUploadModal;
