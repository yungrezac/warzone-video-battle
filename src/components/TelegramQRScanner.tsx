
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QrCode, X } from 'lucide-react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

interface TelegramQRScannerProps {
  onScan?: (text: string) => void;
  onClose?: () => void;
  title?: string;
}

const TelegramQRScanner: React.FC<TelegramQRScannerProps> = ({
  onScan,
  onClose,
  title = "Отсканируйте QR-код"
}) => {
  const { webApp, isTelegramWebApp, hapticFeedback } = useTelegramWebApp();
  const [isScanning, setIsScanning] = useState(false);

  const startScanning = () => {
    if (!isTelegramWebApp || !webApp?.showScanQrPopup) {
      console.warn('QR Scanner недоступен');
      return;
    }

    setIsScanning(true);
    hapticFeedback('impact');

    webApp.showScanQrPopup(
      { text: title },
      (text: string) => {
        setIsScanning(false);
        
        if (text) {
          console.log('QR код отсканирован:', text);
          hapticFeedback('notification');
          onScan?.(text);
        } else {
          console.log('Сканирование отменено');
          onClose?.();
        }
      }
    );
  };

  const stopScanning = () => {
    if (webApp?.closeScanQrPopup) {
      webApp.closeScanQrPopup();
    }
    setIsScanning(false);
    onClose?.();
  };

  if (!isTelegramWebApp) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          QR-сканер доступен только в Telegram Mini App
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={startScanning}
        disabled={isScanning}
        className="flex items-center gap-2 w-full"
        style={{
          backgroundColor: 'var(--tg-theme-button-color)',
          color: 'var(--tg-theme-button-text-color)',
        }}
      >
        <QrCode className="w-5 h-5" />
        {isScanning ? 'Сканируем...' : 'Сканировать QR-код'}
      </Button>

      {isScanning && (
        <Button
          onClick={stopScanning}
          variant="outline"
          className="flex items-center gap-2 w-full"
        >
          <X className="w-4 h-4" />
          Отменить сканирование
        </Button>
      )}
    </div>
  );
};

export default TelegramQRScanner;
