
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
    <div className="p-3 pb-16">
      <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-4 rounded-lg mb-4">
        <h2 className="text-xl font-bold mb-1">Загрузить трюк</h2>
        <p className="opacity-90 text-sm">Поделитесь своим лучшим трюком на роликах и участвуйте в ежедневном соревновании!</p>
      </div>

      <div className="space-y-4">
        {!selectedFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Выберите видео для загрузки
            </h3>
            <p className="text-gray-500 mb-3 text-sm">
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
              <Button variant="ghost" size="sm" onClick={removeFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание (необязательно)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите о своем трюке..."
              className="w-full"
              rows={2}
            />
          </div>
        </div>

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
