
import React, { useState, useRef } from 'react';
import { Upload, Video, X, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useUploadVideo } from '@/hooks/useVideos';
import { useToast } from '@/hooks/use-toast';
import CategorySelector from './CategorySelector';
import VideoEditor from './VideoEditor';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Rollers' | 'BMX' | 'Skateboard'>('Rollers');
  const [showEditor, setShowEditor] = useState(false);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailTime, setThumbnailTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadVideo();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      // Уменьшаем лимит до 25MB
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 25MB. Попробуйте сжать видео.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setShowEditor(false);
      setThumbnailBlob(null);
      setTrimStart(0);
      setTrimEnd(0);
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
      });

      // Очищаем форму после успешной загрузки
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setCategory('Rollers');
      setShowEditor(false);
      setThumbnailBlob(null);
      setTrimStart(0);
      setTrimEnd(0);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Успешно!",
        description: "Видео успешно загружено и появится в ленте после модерации.",
      });
      
      onClose();
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
    setShowEditor(false);
    setThumbnailBlob(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto" hideCloseButton>
        <div className="p-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Загрузить трюк</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Выберите видео для загрузки
                </h3>
                <p className="text-gray-500 mb-2 text-xs">
                  Поддерживаются форматы: MP4, MOV, AVI. Максимальный размер: 25MB
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
                  size="sm"
                >
                  Выбрать файл
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Video className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <p className="font-semibold text-xs">{selectedFile.name}</p>
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
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={removeFile}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {showEditor && (
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
                    <p className="text-xs text-green-700">
                      ✓ Превью выбрано
                    </p>
                  </div>
                )}

                {trimStart > 0 || trimEnd > 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-xs text-blue-700">
                      ✓ Обрезка настроена
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            <CategorySelector 
              selectedCategory={category}
              onCategoryChange={setCategory}
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

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <h4 className="font-semibold text-yellow-800 mb-1 text-xs">Правила конкурса:</h4>
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
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
