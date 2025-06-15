
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Heart, MessageCircle, Trophy, Award, Settings, Users, UserPlus } from 'lucide-react';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, loading } = useNotificationSettings();
  const { t } = useTranslation();

  const handleToggle = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t('notification_settings_title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm">{t('notification_settings_likes')}</span>
            </div>
            <Switch
              checked={settings.likes_notifications}
              onCheckedChange={() => handleToggle('likes_notifications')}
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm">{t('notification_settings_comments')}</span>
            </div>
            <Switch
              checked={settings.comments_notifications}
              onCheckedChange={() => handleToggle('comments_notifications')}
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">{t('notification_settings_achievements')}</span>
            </div>
            <Switch
              checked={settings.achievements_notifications}
              onCheckedChange={() => handleToggle('achievements_notifications')}
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-green-500" />
              <span className="text-sm">{t('notification_settings_winner')}</span>
            </div>
            <Switch
              checked={settings.winners_notifications}
              onCheckedChange={() => handleToggle('winners_notifications')}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-500" />
              <span className="text-sm">{t('notification_settings_new_videos')}</span>
            </div>
            <Switch
              checked={settings.new_video_notifications}
              onCheckedChange={() => handleToggle('new_video_notifications')}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-500" />
              <span className="text-sm">{t('notification_settings_new_subscribers')}</span>
            </div>
            <Switch
              checked={settings.new_subscriber_notifications}
              onCheckedChange={() => handleToggle('new_subscriber_notifications')}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{t('notification_settings_system')}</span>
            </div>
            <Switch
              checked={settings.system_notifications}
              onCheckedChange={() => handleToggle('system_notifications')}
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettings;
