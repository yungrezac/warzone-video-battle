
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTournament } from '@/hooks/useOnlineTournaments';
import { toast } from 'sonner';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    banner_url: '',
    entry_cost_points: 100,
    min_participants: 5,
    end_date: '',
    judge_ids: [] as string[],
  });

  const createTournamentMutation = useCreateTournament();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.banner_url || !formData.end_date) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const endDate = new Date(formData.end_date);
    if (endDate <= new Date()) {
      toast.error('Дата окончания должна быть в будущем');
      return;
    }

    createTournamentMutation.mutate(formData, {
      onSuccess: () => {
        onClose();
        setFormData({
          title: '',
          description: '',
          banner_url: '',
          entry_cost_points: 100,
          min_participants: 5,
          end_date: '',
          judge_ids: [],
        });
      },
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleJudgeIdsChange = (value: string) => {
    // Простой парсинг через запятую для демонстрации
    const ids = value.split(',').map(id => id.trim()).filter(id => id);
    setFormData(prev => ({ ...prev, judge_ids: ids }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать турнир</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Название турнира *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Введите название турнира"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Описание *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Введите описание турнира"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="banner_url">URL баннера *</Label>
            <Input
              id="banner_url"
              value={formData.banner_url}
              onChange={(e) => handleInputChange('banner_url', e.target.value)}
              placeholder="https://example.com/banner.jpg"
              required
            />
          </div>

          <div>
            <Label htmlFor="entry_cost_points">Стоимость участия (баллы)</Label>
            <Input
              id="entry_cost_points"
              type="number"
              value={formData.entry_cost_points}
              onChange={(e) => handleInputChange('entry_cost_points', parseInt(e.target.value))}
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="min_participants">Минимум участников</Label>
            <Input
              id="min_participants"
              type="number"
              value={formData.min_participants}
              onChange={(e) => handleInputChange('min_participants', parseInt(e.target.value))}
              min="2"
            />
          </div>

          <div>
            <Label htmlFor="end_date">Дата окончания *</Label>
            <Input
              id="end_date"
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              required
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
              disabled={createTournamentMutation.isPending}
              className="flex-1"
            >
              {createTournamentMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTournamentModal;
