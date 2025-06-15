import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWithdrawal } from '@/hooks/useWithdrawal';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';
import { Loader2, DollarSign, CreditCard } from 'lucide-react';
import { formatPoints } from '@/lib/utils';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPoints: number;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, userPoints }) => {
  const [amount, setAmount] = useState<number>(0);
  const [walletAddress, setWalletAddress] = useState('');
  const { createWithdrawalRequest, isCreatingRequest } = useWithdrawal();
  const { user } = useAuth();

  const minWithdrawal = 100000; // Минимум 100 000 баллов
  const pointToUsdtRate = 1 / 1000; // 1000 баллов = 1 USDT

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Необходима авторизация');
      return;
    }

    if (amount < minWithdrawal) {
      toast.error(`Минимальная сумма для вывода: ${formatPoints(minWithdrawal)} Б`);
      return;
    }

    if (amount > userPoints) {
      toast.error('Недостаточно баллов');
      return;
    }

    if (!walletAddress.trim()) {
      toast.error('Введите адрес кошелька USDT');
      return;
    }

    try {
      await createWithdrawalRequest.mutateAsync({
        amount_points: amount,
        amount_usdt: amount * pointToUsdtRate,
        wallet_address: walletAddress.trim(),
      });

      toast.success('Заявка на вывод создана успешно!');
      onClose();
      
      setAmount(0);
      setWalletAddress('');
    } catch (error: any) {
      console.error('Ошибка создания заявки:', error);
      toast.error(error.message || 'Ошибка при создании заявки на вывод');
    }
  };

  const handleClose = () => {
    if (!isCreatingRequest) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Вывод средств в USDT
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Доступно:</strong> {formatPoints(userPoints)} Б (≈{(userPoints * pointToUsdtRate).toFixed(2)} USDT)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Минимум для вывода: {formatPoints(minWithdrawal)} Б
            </p>
          </div>

          <div>
            <Label htmlFor="amount">Сумма к выводу (в баллах)</Label>
            <Input
              id="amount"
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder={`Минимум ${formatPoints(minWithdrawal)}`}
              min={minWithdrawal}
              max={userPoints}
              disabled={isCreatingRequest}
            />
            {amount > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                К выводу: {(amount * pointToUsdtRate).toFixed(2)} USDT
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="walletAddress" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Адрес кошелька USDT (TRC-20)
            </Label>
            <Input
              id="walletAddress"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="T..."
              disabled={isCreatingRequest}
            />
             <p className="text-xs text-gray-500 mt-1">Пожалуйста, убедитесь, что адрес указан верно. Мы не несем ответственности за утерю средств.</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Обработка заявки:</h4>
            <ul className="text-xs text-yellow-700 space-y-0.5">
              <li>• Заявки обрабатываются в течение 1-3 рабочих дней.</li>
              <li>• Убедитесь, что ваш кошелек поддерживает сеть TRC-20.</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isCreatingRequest}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={isCreatingRequest || amount < minWithdrawal || amount > userPoints || !walletAddress.trim()}
              className="flex-1"
            >
              {isCreatingRequest && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Создать заявку
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalModal;
