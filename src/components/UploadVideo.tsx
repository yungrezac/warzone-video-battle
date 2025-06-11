
import React, { useState, useRef } from 'react';
import { Upload, Video, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUploadVideo } from '@/hooks/useVideos';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthWrapper';
import CategorySelector from './CategorySelector';

const UploadVideo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Rollers' | 'BMX' | 'Skateboard'>('Rollers');
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

    // Строгая проверка размера файла (25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "Файл слишком большой",
        description: "Размер файла не должен превышать 25MB. Сожмите видео в любом видеоредакторе.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
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
      console.log('🎬 Начинаем загрузку видео для пользователя:', user.id);
      
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
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Успешно!",
        description: "Видео загружено и появится в ленте",
      });
    } catch (error) {
      console.error('❌ Ошибка загрузки:', error);
      setUploadProgress(0);
      
      let errorMessage = 'Попробуйте еще раз';
      if (error instanceof Error) {
        if (error.message.includes('25MB') || error.message.includes('size')) {
          errorMessage = 'Файл слишком большой. Максимум: 25MB';
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
              Поддерживаются форматы: MP4, MOV, AVI. Максимальный размер: <span className="font-semibold text-red-600">25MB</span>
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
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={removeFile} disabled={isUploading}>
                <X className="w-4 h-4" />
              </Button>
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

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Правила загрузки:</h4>
          <ul className="text-xs text-yellow-700 space-y-0.5">
            <li>• Максимальный размер файла: 25MB</li>
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
  );
};

export default UploadVideo;
