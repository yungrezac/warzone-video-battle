
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBattle } from '@/hooks/useVideoBattles';
import { toast } from 'sonner';

interface CreateBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateBattleModal: React.FC<CreateBattleModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reference_video_url: '',
    reference_video_title: '',
    start_time: '',
    time_limit_minutes: 30,
    prize_points: 500,
    judge_ids: [] as string[],
  });

  const createBattleMutation = useCreateBattle();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.reference_video_url || !formData.start_time) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const startTime = new Date(formData.start_time);
    if (startTime <= new Date()) {
      toast.error('Время начала должно быть в будущем');
      return;
    }

    createBattleMutation.mutate(formData, {
      onSuccess: () => {
        onClose();
        setFormData({
          title: '',
          description: '',
          reference_video_url: '',
          reference_video_title: '',
          start_time: '',
          time_limit_minutes: 30,
          prize_points: 500,
          judge_ids: [],
        });
      },
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleJudgeIdsChange = (value: string) => {
    const ids = value.split(',').map(id => id.trim()).filter(id => id);
    setFormData(prev => ({ ...prev, judge_ids: ids }));
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
            <Label htmlFor="reference_video_url">URL эталонного видео *</Label>
            <Input
              id="reference_video_url"
              value={formData.reference_video_url}
              onChange={(e) => handleInputChange('reference_video_url', e.target.value)}
              placeholder="https://example.com/video.mp4"
              required
            />
          </div>

          <div>
            <Label htmlFor="reference_video_title">Название эталонного видео</Label>
            <Input
              id="reference_video_title"
              value={formData.reference_video_title}
              onChange={(e) => handleInputChange('reference_video_title', e.target.value)}
              placeholder="Введите название видео"
            />
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
            <Label htmlFor="judge_ids">ID судей (через запятую)</Label>
            <Input
              id="judge_ids"
              value={formData.judge_ids.join(', ')}
              onChange={(e) => handleJudgeIdsChange(e.target.value)}
              placeholder="id1, id2, id3..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Введите ID пользователей, которые будут судьями
            </p>
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
              disabled={createBattleMutation.isPending}
              className="flex-1"
            >
              {createBattleMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBattleModal;
