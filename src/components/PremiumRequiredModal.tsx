
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Loader2 } from 'lucide-react';

interface PremiumRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

const PremiumRequiredModal: React.FC<PremiumRequiredModalProps> = ({ isOpen, onClose, onConfirm, isPending }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader className="flex flex-col items-center space-y-4 pt-4">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-800">Требуется Premium</DialogTitle>
            <DialogDescription className="text-gray-600 text-sm px-4">
              Покупки за баллы доступны только для премиум пользователей.
            </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2 pt-4">
            <Button onClick={onConfirm} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isPending ? 'Загрузка...' : 'Приобрести Premium'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Отмена
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumRequiredModal;
