
import React, { useState, useRef } from 'react';
import { UploadIcon, Video, X, Edit, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useUploadVideo } from '@/hooks/useVideos';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import CategorySelector from '@/components/CategorySelector';
import VideoEditor from '@/components/VideoEditor';

const Upload: React.FC = () => {
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadVideo();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 100MB",
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
    } else {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите видео файл",
        variant: "destructive",
      });
    }
  };

  const handleButtonClick = () => {
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
    if (!selectedFile || !title.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите файл и введите название",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      console.log('Начинаем загрузку видео...');
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

      toast({
        title: "Успешно!",
        description: "Видео успешно загружено и появится в ленте после модерации.",
      });
      
      // Сбрасываем форму
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setShowEditor(false);
      setThumbnailBlob(null);
      setUploadProgress(0);
      
      // Возвращаемся на главную через 2 секунды
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      console.error('Ошибка загрузки:', error);
      toast({
        title: "Ошибка",
        description: error.message || 'Не удалось загрузить видео. Попробуйте еще раз',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setShowEditor(false);
    setThumbnailBlob(null);
    setUploadProgress(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} disabled={isUploading}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-bold text-gray-800">Загрузить трюк</h1>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        <div className="space-y-4">
          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <UploadIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Выберите видео для загрузки
              </h3>
              <p className="text-gray-500 mb-3 text-sm">
                Поддерживаются форматы: MP4, MOV, AVI, MKV, WEBM. Максимальный размер: 100MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <Button 
                onClick={handleButtonClick}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isUploading}
              >
                Выбрать файл
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={removeFile}
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
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
            <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Правила конкурса:</h4>
            <ul className="text-xs text-yellow-700 space-y-0.5">
              <li>• Видео проходит модерацию перед публикацией</li>
              <li>• Победитель определяется каждый день в 00:00</li>
              <li>• Баллы начисляются равно количеству полученных оценок</li>
              <li>• Запрещены опасные трюки без защитной экипировки</li>
            </ul>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !title.trim() || isUploading}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:opacity-50"
          >
            {isUploading ? `Загрузка... ${uploadProgress}%` : 'Загрузить трюк'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Upload;
