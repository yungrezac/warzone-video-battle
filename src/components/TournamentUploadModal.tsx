
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { useUploadTournamentVideo } from '@/hooks/useOnlineTournaments';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';

interface TournamentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
}

const TournamentUploadModal: React.FC<TournamentUploadModalProps> = ({
  isOpen,
  onClose,
  tournamentId,
}) => {
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const uploadVideoMutation = useUploadTournamentVideo();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error('Размер файла не должен превышать 100MB');
        return;
      }
      if (!file.type.startsWith('video/')) {
        toast.error('Пожалуйста, выберите видео файл');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim() || !user) {
      toast.error('Заполните все поля и выберите файл');
      return;
    }

    try {
      // В реальном приложении здесь должна быть загрузка в облачное хранилище
      // Для демонстрации используем временный URL
      const mockVideoUrl = `https://example.com/videos/${selectedFile.name}`;
      const mockThumbnailUrl = `https://example.com/thumbnails/${selectedFile.name}.jpg`;

      uploadVideoMutation.mutate({
        tournamentId,
        userId: user.id,
        title: title.trim(),
        videoUrl: mockVideoUrl,
        thumbnailUrl: mockThumbnailUrl,
      }, {
        onSuccess: () => {
          onClose();
          setTitle('');
          setSelectedFile(null);
          setUploadProgress(0);
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Ошибка при загрузке видео');
    }
  };

  const handleClose = () => {
    onClose();
    setTitle('');
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Загрузить турнирное видео</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="video-title">Название видео *</Label>
            <Input
              id="video-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название видео"
              required
            />
          </div>

          <div>
            <Label>Видео файл *</Label>
            <div className="mt-2">
              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">Нажмите для выбора видео</p>
                  <p className="text-xs text-gray-500 mt-1">Максимум 100MB</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <Upload className="w-4 h-4 mr-2 text-green-500" />
                    <span className="text-sm truncate">{selectedFile.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploadVideoMutation.isPending}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !title.trim() || uploadVideoMutation.isPending}
              className="flex-1"
            >
              {uploadVideoMutation.isPending ? 'Загрузка...' : 'Загрузить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentUploadModal;
