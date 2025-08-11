
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  MapPin, 
  Camera, 
  Mic, 
  Bell, 
  Fingerprint,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useTelegramSettings } from '@/hooks/useTelegramSettings';
import { useTelegramBiometric } from '@/hooks/useTelegramBiometric';
import { useTelegramLocation } from '@/hooks/useTelegramLocation';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'granted' | 'denied' | 'pending';
  required: boolean;
}

const TelegramPermissions: React.FC = () => {
  const { settings, updateSetting, requestPermissions, requestContact } = useTelegramSettings();
  const { authenticate, isAvailable: biometricAvailable } = useTelegramBiometric();
  const { getCurrentLocation, isAvailable: locationAvailable } = useTelegramLocation();
  const { isTelegramWebApp, hapticFeedback } = useTelegramWebApp();

  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'notifications',
      name: 'Уведомления',
      description: 'Получать уведомления о лайках и комментариях',
      icon: <Bell className="w-5 h-5" />,
      status: 'pending',
      required: false,
    },
    {
      id: 'location',
      name: 'Местоположение',
      description: 'Для добавления геометки к видео',
      icon: <MapPin className="w-5 h-5" />,
      status: 'pending',
      required: false,
    },
    {
      id: 'camera',
      name: 'Камера',
      description: 'Для съемки и загрузки видео',
      icon: <Camera className="w-5 h-5" />,
      status: 'pending',
      required: true,
    },
    {
      id: 'microphone',
      name: 'Микрофон',
      description: 'Для записи звука в видео',
      icon: <Mic className="w-5 h-5" />,
      status: 'pending',
      required: true,
    },
    {
      id: 'biometric',
      name: 'Биометрия',
      description: 'Для быстрого входа в приложение',
      icon: <Fingerprint className="w-5 h-5" />,
      status: biometricAvailable ? 'granted' : 'denied',
      required: false,
    },
  ]);

  const checkPermissions = async () => {
    // Проверяем разрешения браузера
    try {
      // Проверка камеры и микрофона
      const mediaPermissions = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = mediaPermissions.some(device => device.kind === 'videoinput');
      const hasMicrophone = mediaPermissions.some(device => device.kind === 'audioinput');

      // Проверка геолокации
      let locationStatus: 'granted' | 'denied' | 'pending' = 'pending';
      if (navigator.geolocation) {
        try {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 1000 });
          });
          locationStatus = 'granted';
        } catch {
          locationStatus = 'denied';
        }
      }

      setPermissions(prev => prev.map(permission => {
        switch (permission.id) {
          case 'camera':
            return { ...permission, status: hasCamera ? 'granted' : 'denied' };
          case 'microphone':
            return { ...permission, status: hasMicrophone ? 'granted' : 'denied' };
          case 'location':
            return { ...permission, status: locationAvailable ? locationStatus : 'denied' };
          case 'biometric':
            return { ...permission, status: biometricAvailable ? 'granted' : 'denied' };
          case 'notifications':
            return { ...permission, status: settings.notifications ? 'granted' : 'denied' };
          default:
            return permission;
        }
      }));
    } catch (error) {
      console.error('Ошибка проверки разрешений:', error);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, [settings, biometricAvailable, locationAvailable]);

  const handlePermissionRequest = async (permissionId: string) => {
    hapticFeedback('impact');

    switch (permissionId) {
      case 'notifications':
        updateSetting('notifications', !settings.notifications);
        break;

      case 'location':
        try {
          await getCurrentLocation();
          await checkPermissions();
        } catch (error) {
          console.error('Ошибка запроса геолокации:', error);
        }
        break;

      case 'camera':
      case 'microphone':
        try {
          await navigator.mediaDevices.getUserMedia({
            video: permissionId === 'camera',
            audio: permissionId === 'microphone',
          });
          await checkPermissions();
        } catch (error) {
          console.error(`Ошибка запроса ${permissionId}:`, error);
        }
        break;

      case 'biometric':
        try {
          await authenticate('Настройка быстрого входа');
          await checkPermissions();
        } catch (error) {
          console.error('Ошибка биометрии:', error);
        }
        break;

      case 'telegram_write':
        try {
          await requestPermissions();
          await checkPermissions();
        } catch (error) {
          console.error('Ошибка запроса доступа к записи:', error);
        }
        break;

      case 'telegram_contact':
        try {
          await requestContact();
          await checkPermissions();
        } catch (error) {
          console.error('Ошибка запроса контакта:', error);
        }
        break;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'denied':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'granted':
        return 'Разрешено';
      case 'denied':
        return 'Отклонено';
      default:
        return 'Ожидает';
    }
  };

  return (
    <Card className="telegram-native-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Разрешения приложения
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {permissions.map((permission) => (
          <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {permission.icon}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{permission.name}</span>
                  {permission.required && (
                    <Badge variant="destructive" className="text-xs">
                      Обязательно
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {permission.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {getStatusIcon(permission.status)}
                <span className="text-sm">
                  {getStatusText(permission.status)}
                </span>
              </div>

              {permission.status !== 'granted' && (
                <Button
                  onClick={() => handlePermissionRequest(permission.id)}
                  size="sm"
                  variant="outline"
                  className="telegram-native-button"
                >
                  Разрешить
                </Button>
              )}
            </div>
          </div>
        ))}

        {isTelegramWebApp && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              🤖 Telegram WebApp функции:
            </h4>
            <div className="space-y-2">
              <Button
                onClick={() => handlePermissionRequest('telegram_write')}
                variant="outline"
                size="sm"
                className="w-full telegram-native-button"
              >
                Запросить доступ к записи
              </Button>
              <Button
                onClick={() => handlePermissionRequest('telegram_contact')}
                variant="outline"
                size="sm"
                className="w-full telegram-native-button"
              >
                Поделиться контактом
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TelegramPermissions;
