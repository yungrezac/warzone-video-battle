
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QrCode, X } from 'lucide-react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { toast } from 'sonner';

interface TelegramQRScannerProps {
  onScan?: (data: string) => void;
  title?: string;
  instruction?: string;
}

const TelegramQRScanner: React.FC<TelegramQRScannerProps> = ({ 
  onScan, 
  title = 'Сканировать QR код',
  instruction = 'Наведите камеру на QR код' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { showScanQrPopup, closeScanQrPopup, isTelegramWebApp, hapticFeedback } = useTelegramWebApp();

  const handleStartScan = () => {
    if (!isTelegramWebApp) {
      toast.error('QR-сканер доступен только в Telegram Mini App');
      return;
    }

    hapticFeedback('impact');
    setIsScanning(true);
    
    showScanQrPopup(instruction, (scannedText: string) => {
      setIsScanning(false);
      setIsOpen(false);
      
      if (scannedText) {
        hapticFeedback('notification');
        onScan?.(scannedText);
        toast.success('QR код успешно отсканирован!');
      } else {
        toast.info('Сканирование отменено');
      }
    });
  };

  const handleClose = () => {
    if (isScanning) {
      closeScanQrPopup();
      setIsScanning(false);
    }
    setIsOpen(false);
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <QrCode className="w-4 h-4" />
        Сканировать QR
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              {title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {!isTelegramWebApp ? (
              <div className="text-center py-8">
                <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  QR-сканер доступен только в Telegram Mini App
                </p>
                <Button onClick={handleClose} variant="outline">
                  Закрыть
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <QrCode className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <p className="text-gray-700 mb-4">{instruction}</p>
                
                {isScanning ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Сканирование активно...</p>
                    <Button onClick={handleClose} variant="outline" size="sm">
                      <X className="w-4 h-4 mr-2" />
                      Отменить
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleStartScan} className="w-full">
                    <QrCode className="w-4 h-4 mr-2" />
                    Начать сканирование
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TelegramQRScanner;
