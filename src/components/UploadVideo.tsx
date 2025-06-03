import React, { useState, useRef } from 'react';
import { Upload, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUploadVideo } from '@/hooks/useVideos';
import { useToast } from '@/hooks/use-toast';

const UploadVideo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadVideo();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      // Проверяем размер файла (100MB = 100 * 1024 * 1024 bytes)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 100MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
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

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите файл и введите название",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Начинаем загрузку видео...');
      await uploadMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        videoFile: selectedFile,
      });

      // Очищаем форму после успешной загрузки
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      
      // Сбрасываем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Успешно!",
        description: "Видео успешно загружено и появится в ленте после модерации.",
      });
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      toast({
        title: "Ошибка",
        description: `Не удалось загрузить видео: ${error.message || 'Попробуйте еще раз'}`,
        variant: "destructive",
      });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="p-4 pb-20">
      <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-lg mb-6">
        <h2 className="text-2xl font-bold mb-2">Загрузить трюк</h2>
        <p className="opacity-90">Поделитесь своим лучшим трюком на роликах и участвуйте в ежедневном соревновании!</p>
      </div>

      <div className="space-y-6">
        {!selectedFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Выберите видео для загрузки
            </h3>
            <p className="text-gray-500 mb-4">
              Поддерживаются форматы: MP4, MOV, AVI. Максимальный размер: 100MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              onClick={handleButtonClick}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Выбрать файл
            </Button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Video className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="font-semibold">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={removeFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название трюка *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: 360 Spin, Backflip, Grind..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание (необязательно)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите о своем трюке..."
              className="w-full"
              rows={3}
            />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">Правила конкурса:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Видео проходит модерацию перед публикацией</li>
            <li>• Победитель определяется каждый день в 00:00</li>
            <li>• Баллы начисляются равно количеству полученных оценок</li>
            <li>• Запрещены опасные трюки без защитной экипировки</li>
          </ul>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !title.trim() || uploadMutation.isPending}
          className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
        >
          {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить трюк'}
        </Button>
      </div>
    </div>
  );
};

export default UploadVideo;
