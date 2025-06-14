
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWithdrawal } from '@/hooks/useWithdrawal';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';
import { Loader2, DollarSign, Wallet, Crown } from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPoints: number;
  isPremium: boolean;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, userPoints, isPremium }) => {
  const [amount, setAmount] = useState<number>(0);
  const [usdtWallet, setUsdtWallet] = useState('');
  const { createWithdrawalRequest, isCreatingRequest } = useWithdrawal();
  const { user } = useAuth();

  const minWithdrawal = 100000; // Минимум 100000 баллов
  const pointToUsdtRate = 0.001; // 1000 баллов = 1 USDT

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Необходима авторизация');
      return;
    }

    if (!isPremium) {
      toast.error('Вывод средств доступен только для Premium пользователей');
      return;
    }

    if (amount < minWithdrawal) {
      toast.error(`Минимальная сумма для вывода: ${minWithdrawal.toLocaleString()} баллов`);
      return;
    }

    if (amount > userPoints) {
      toast.error('Недостаточно баллов');
      return;
    }

    if (!usdtWallet.trim()) {
      toast.error('Введите USDT кошелек');
      return;
    }

    try {
      await createWithdrawalRequest.mutateAsync({
        amount_points: amount,
        amount_usdt: amount * pointToUsdtRate,
        usdt_wallet: usdtWallet.trim(),
      });

      toast.success('Заявка на вывод создана успешно!');
      onClose();
      
      // Сбрасываем форму
      setAmount(0);
      setUsdtWallet('');
    } catch (error) {
      console.error('Ошибка создания заявки:', error);
      toast.error('Ошибка при создании заявки на вывод');
    }
  };

  const handleClose = () => {
    if (!isCreatingRequest) {
      onClose();
    }
  };

  if (!isPremium) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Premium требуется
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold text-yellow-800 mb-2">Premium подписка требуется</h3>
              <p className="text-sm text-yellow-700">
                Вывод средств доступен только для Premium пользователей
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Понятно
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Вывод USDT
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Доступно:</strong> {userPoints.toLocaleString()} баллов ({(userPoints * pointToUsdtRate).toFixed(3)} USDT)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Минимум для вывода: {minWithdrawal.toLocaleString()} баллов
            </p>
            <p className="text-xs text-blue-600">
              Курс: 1000 баллов = 1 USDT
            </p>
          </div>

          <div>
            <Label htmlFor="amount">Сумма к выводу (в баллах)</Label>
            <Input
              id="amount"
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder={`Минимум ${minWithdrawal.toLocaleString()}`}
              min={minWithdrawal}
              max={userPoints}
              disabled={isCreatingRequest}
            />
            {amount > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                К выводу: {(amount * pointToUsdtRate).toFixed(3)} USDT
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="usdtWallet" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              USDT кошелек (TRC20/ERC20)
            </Label>
            <Input
              id="usdtWallet"
              value={usdtWallet}
              onChange={(e) => setUsdtWallet(e.target.value)}
              placeholder="0x... или T..."
              disabled={isCreatingRequest}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Обработка заявки:</h4>
            <ul className="text-xs text-yellow-700 space-y-0.5">
              <li>• Заявки обрабатываются в течение 1-3 рабочих дней</li>
              <li>• USDT поступает на кошелек в течение 24 часов</li>
              <li>• Поддерживаются сети TRC20 и ERC20</li>
              <li>• Комиссия сети оплачивается отдельно</li>
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
              disabled={isCreatingRequest || amount < minWithdrawal || amount > userPoints}
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
