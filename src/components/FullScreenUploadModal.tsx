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
import { generateQuickThumbnail } from '@/utils/videoOptimization';

interface FullScreenUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFile: File;
}
const FullScreenUploadModal: React.FC<FullScreenUploadModalProps> = ({
  isOpen,
  onClose,
  initialFile
}) => {
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
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  useEffect(() => {
    if (initialFile) {
      if (!initialFile.type.startsWith('video/')) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, выберите видео файл",
          variant: "destructive"
        });
        onClose();
        return;
      }
      if (initialFile.size > 50 * 1024 * 1024) {
        toast({
          title: "Файл слишком большой",
          description: "Размер файла не должен превышать 50MB. Сожмите видео в любом видеоредакторе.",
          variant: "destructive"
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
      
      generateQuickThumbnail(initialFile).then(blob => {
        setThumbnailBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setThumbnailGenerated(true);
        console.log('✅ Превью для загрузки и отображения создано');
      }).catch(error => {
        console.warn('⚠️ Не удалось создать превью для загрузки:', error);
        setPreviewUrl(null);
        setThumbnailBlob(null);
      });
    }
  }, [initialFile, onClose, toast]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите видео файл",
        variant: "destructive"
      });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Файл слишком большой",
        description: "Размер файла не должен превышать 50MB. Сожмите видео в любом видеоредакторе.",
        variant: "destructive"
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

    generateQuickThumbnail(file).then(blob => {
        setThumbnailBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setThumbnailGenerated(true);
        console.log('✅ Превью для загрузки и отображения создано (файл изменен)');
    }).catch(error => {
        console.warn('⚠️ Не удалось создать превью для загрузки (файл изменен):', error);
        setPreviewUrl(null);
        setThumbnailBlob(null);
    });
  };
  const handleButtonClick = () => {
    if (!user) {
      toast({
        title: "Необходима авторизация",
        description: "Войдите в систему для загрузки видео",
        variant: "destructive"
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
        variant: "destructive"
      });
      return;
    }
    if (!selectedFile || !title.trim()) {
      toast({
        title: "Заполните данные",
        description: "Выберите файл и введите название",
        variant: "destructive"
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
        thumbnailBlob: thumbnailBlob,
        onProgress: setUploadProgress
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
        description: "Видео загружено и появится в ленте"
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
        variant: "destructive"
      });
    }
  };
  const removeFile = () => {
    onClose();
  };
  const isUploading = uploadMutation.isPending;
  return <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="w-full h-full max-w-none max-h-none m-0 p-0 rounded-none" hideCloseButton>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-4 flex items-center py-[4px]">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20 mr-3 p-2" disabled={isUploading}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold py-0">Загрузить трюк</h1>
              
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-0 overflow-y-auto py-0 px-0 ">
            <div className="max-w-screen-md max-w-screen-md max-w-screen-md max-w-screen-md max-w-screen-md mx-0 px-[8px] py-[6px]">
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" disabled={isUploading} />
              {!selectedFile ? <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center flex justify-center items-center h-48">
                  <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                </div> : <>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3 px-0 py-px">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Video className="w-6 h-6 text-blue-600 mr-2" />
                          <div>
                            <p className="font-semibold text-sm">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            {shouldCompress(selectedFile) && <p className="text-xs text-blue-600">
                                🗜️ Будет сжато для быстрой загрузки
                              </p>}
                            {thumbnailGenerated && <p className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Превью создано автоматически
                              </p>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                           <Button variant="ghost" size="sm" onClick={handleButtonClick} className="text-blue-600" title="Изменить файл" disabled={isUploading}>
                            <Upload className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setShowEditor(!showEditor)} className="text-blue-600" title="Редактировать" disabled={isUploading}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={removeFile} disabled={isUploading} title="Отменить">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {previewUrl && <div className="mb-3">
                          <p className="text-xs text-gray-600 mb-2 px-[3px]">Автоматически созданное превью:</p>
                          <div className="w-full max-w-xs mx-auto">
                            <img src={previewUrl} alt="Превью видео" className="w-full h-auto rounded border border-gray-200" style={{
                        maxHeight: '150px',
                        objectFit: 'cover'
                      }} />
                          </div>
                        </div>}
                      
                      {isUploading && uploadProgress > 0 && <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{
                      width: `${uploadProgress}%`
                    }}></div>
                        </div>}
                    </div>

                    {showEditor && !isUploading && <div className="border border-gray-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold mb-2">Редактор видео</h4>
                        <VideoEditor videoFile={selectedFile} onThumbnailSelect={handleThumbnailSelect} onVideoTrim={handleVideoTrim} />
                      </div>}

                    {thumbnailBlob && <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="text-xs text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Превью выбрано
                        </p>
                      </div>}

                    {(trimStart > 0 || trimEnd > 0) && <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-xs text-blue-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Обрезка настроена
                        </p>
                      </div>}
                  </div>

                  <CategorySelector selectedCategory={category} onCategoryChange={setCategory} disabled={isUploading} />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 px-[2px]">
                      Название трюка *
                    </label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: 360 Spin, Backflip, Grind..." disabled={isUploading} maxLength={100} className="w-full py-0" />
                  </div>

                  

                  {isUploading && <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">Загрузка видео...</span>
                        <span className="text-sm text-blue-600">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                      <p className="text-xs text-blue-600 mt-1">
                        {uploadProgress < 50 ? 'Загружаем видео...' : uploadProgress < 75 ? 'Загружаем превью...' : uploadProgress < 90 ? 'Сохраняем в базу данных...' : uploadProgress < 100 ? 'Обновляем достижения...' : 'Готово!'}
                      </p>
                    </div>}

                  

                  <Button onClick={handleUpload} disabled={!selectedFile || !title.trim() || isUploading || !user} className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 py-[2px] text-sm my-[17px]">
                    {isUploading ? <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Загрузка... {uploadProgress}%
                      </> : 'Загрузить трюк'}
                  </Button>
                </>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default FullScreenUploadModal;
