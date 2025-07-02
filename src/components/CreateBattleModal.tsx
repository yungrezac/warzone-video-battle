
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateBattle } from '@/hooks/useVideoBattles';
import { useUsers } from '@/hooks/useUsers';
import { uploadBattleVideo } from '@/utils/videoUpload';
import { toast } from 'sonner';
import { Upload, Video } from 'lucide-react';

interface CreateBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateBattleModal: React.FC<CreateBattleModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    time_limit_minutes: 30,
    prize_points: 500,
    judge_id: '',
  });
  
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createBattleMutation = useCreateBattle();
  const { data: users, isLoading: isLoadingUsers } = useUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !selectedVideo || !formData.start_time || !formData.judge_id) {
      toast.error('Заполните все обязательные поля и выберите видео');
      return;
    }

    const startTime = new Date(formData.start_time);
    if (startTime <= new Date()) {
      toast.error('Время начала должно быть в будущем');
      return;
    }

    setIsUploading(true);
    try {
      // Сначала создаем батл для получения ID
      const tempBattleId = Date.now().toString();
      const videoUrl = await uploadBattleVideo(selectedVideo, tempBattleId);
      
      createBattleMutation.mutate({
        title: formData.title,
        description: formData.description,
        reference_video_url: videoUrl,
        reference_video_title: formData.title,
        start_time: formData.start_time,
        time_limit_minutes: formData.time_limit_minutes,
        prize_points: formData.prize_points,
        judge_ids: [formData.judge_id],
      }, {
        onSuccess: () => {
          onClose();
          setFormData({
            title: '',
            description: '',
            start_time: '',
            time_limit_minutes: 30,
            prize_points: 500,
            judge_id: '',
          });
          setSelectedVideo(null);
          toast.success('Видеобатл успешно создан!');
        },
        onError: (error) => {
          toast.error('Ошибка при создании видеобатла');
          console.error(error);
        }
      });
    } catch (error) {
      toast.error('Ошибка при загрузке видео');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setSelectedVideo(file);
        toast.success(`Выбрано видео: ${file.name}`);
      } else {
        toast.error('Выберите видео файл');
      }
    }
  };

  const getUserDisplayName = (user: any) => {
    return user.username || user.first_name || user.telegram_username || `User ${user.id.slice(0, 8)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать видеобатл</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Название батла *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Введите название батла"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Описание *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Введите описание батла"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="reference_video">Эталонное видео *</Label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2"
                disabled={isUploading}
              >
                <Upload className="w-4 h-4" />
                {selectedVideo ? selectedVideo.name : 'Выберите видео файл'}
              </Button>
              {selectedVideo && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Video className="w-4 h-4" />
                  <span>Видео готово к загрузке</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="start_time">Время начала *</Label>
            <Input
              id="start_time"
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="time_limit_minutes">Лимит времени (минуты)</Label>
            <Input
              id="time_limit_minutes"
              type="number"
              value={formData.time_limit_minutes}
              onChange={(e) => handleInputChange('time_limit_minutes', parseInt(e.target.value))}
              min="5"
              max="120"
            />
          </div>

          <div>
            <Label htmlFor="prize_points">Призовые баллы</Label>
            <Input
              id="prize_points"
              type="number"
              value={formData.prize_points}
              onChange={(e) => handleInputChange('prize_points', parseInt(e.target.value))}
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="judge_id">Судья *</Label>
            <Select
              value={formData.judge_id}
              onValueChange={(value) => handleInputChange('judge_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите судью" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto z-50">
                {isLoadingUsers ? (
                  <SelectItem value="" disabled>Загрузка пользователей...</SelectItem>
                ) : (
                  users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {getUserDisplayName(user)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={createBattleMutation.isPending || isUploading}
              className="flex-1"
            >
              {isUploading ? 'Загрузка видео...' : createBattleMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBattleModal;
