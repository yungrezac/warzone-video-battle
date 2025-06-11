
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Heart, MessageCircle, Trophy, Award } from 'lucide-react';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    likes: true,
    comments: true,
    achievements: true,
    dailyWinner: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    // Здесь будет логика сохранения настроек
    console.log('Сохраняем настройки:', settings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Настройки уведомлений
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm">Лайки</span>
            </div>
            <Switch
              checked={settings.likes}
              onCheckedChange={() => handleToggle('likes')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Комментарии</span>
            </div>
            <Switch
              checked={settings.comments}
              onCheckedChange={() => handleToggle('comments')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">Достижения</span>
            </div>
            <Switch
              checked={settings.achievements}
              onCheckedChange={() => handleToggle('achievements')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-500" />
              <span className="text-sm">Победитель дня</span>
            </div>
            <Switch
              checked={settings.dailyWinner}
              onCheckedChange={() => handleToggle('dailyWinner')}
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettings;
