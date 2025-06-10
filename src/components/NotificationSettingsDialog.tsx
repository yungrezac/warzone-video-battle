
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/useNotificationSettings';
import { toast } from 'sonner';

interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationSettingsDialog: React.FC<NotificationSettingsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { data: settings, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
      toast.success('Настройки обновлены');
    } catch (error) {
      toast.error('Ошибка обновления настроек');
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md mx-auto">
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Загрузка...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Настройки уведомлений</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="likes" className="text-sm font-medium">
              Уведомления о лайках
            </Label>
            <Switch
              id="likes"
              checked={settings?.likes_notifications ?? true}
              onCheckedChange={(checked) => handleToggle('likes_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="comments" className="text-sm font-medium">
              Уведомления о комментариях
            </Label>
            <Switch
              id="comments"
              checked={settings?.comments_notifications ?? true}
              onCheckedChange={(checked) => handleToggle('comments_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="winners" className="text-sm font-medium">
              Уведомления о победителях
            </Label>
            <Switch
              id="winners"
              checked={settings?.winners_notifications ?? true}
              onCheckedChange={(checked) => handleToggle('winners_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="system" className="text-sm font-medium">
              Системные уведомления
            </Label>
            <Switch
              id="system"
              checked={settings?.system_notifications ?? true}
              onCheckedChange={(checked) => handleToggle('system_notifications', checked)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
