
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWithdrawal } from '@/hooks/useWithdrawal';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';
import { Loader2, DollarSign, CreditCard, Phone, User } from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPoints: number;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, userPoints }) => {
  const [amount, setAmount] = useState<number>(0);
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const { createWithdrawalRequest, isCreatingRequest } = useWithdrawal();
  const { user } = useAuth();

  const minWithdrawal = 1000; // Минимум 1000 баллов
  const pointToRubleRate = 0.1; // 1 балл = 0.1 рубля

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Необходима авторизация');
      return;
    }

    if (amount < minWithdrawal) {
      toast.error(`Минимальная сумма для вывода: ${minWithdrawal} баллов`);
      return;
    }

    if (amount > userPoints) {
      toast.error('Недостаточно баллов');
      return;
    }

    if (!recipientName.trim() || !phoneNumber.trim() || !bankName.trim()) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      await createWithdrawalRequest.mutateAsync({
        amount_points: amount,
        amount_rubles: amount * pointToRubleRate,
        recipient_name: recipientName.trim(),
        phone_number: phoneNumber.trim(),
        bank_name: bankName.trim(),
      });

      toast.success('Заявка на вывод создана успешно!');
      onClose();
      
      // Сбрасываем форму
      setAmount(0);
      setRecipientName('');
      setPhoneNumber('');
      setBankName('');
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Вывод средств
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Доступно:</strong> {userPoints} баллов ({(userPoints * pointToRubleRate).toFixed(2)} ₽)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Минимум для вывода: {minWithdrawal} баллов
            </p>
          </div>

          <div>
            <Label htmlFor="amount">Сумма к выводу (в баллах)</Label>
            <Input
              id="amount"
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder={`Минимум ${minWithdrawal}`}
              min={minWithdrawal}
              max={userPoints}
              disabled={isCreatingRequest}
            />
            {amount > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                К выводу: {(amount * pointToRubleRate).toFixed(2)} ₽
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="recipientName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              ФИО получателя
            </Label>
            <Input
              id="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Иванов Иван Иванович"
              disabled={isCreatingRequest}
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Номер телефона
            </Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+7 (900) 123-45-67"
              disabled={isCreatingRequest}
            />
          </div>

          <div>
            <Label htmlFor="bankName" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Название банка
            </Label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Сбербанк, ВТБ, Тинькофф..."
              disabled={isCreatingRequest}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Обработка заявки:</h4>
            <ul className="text-xs text-yellow-700 space-y-0.5">
              <li>• Заявки обрабатываются в течение 1-3 рабочих дней</li>
              <li>• Средства поступают на карту в течение 1-5 рабочих дней</li>
              <li>• Комиссия банка может составлять 1-3%</li>
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
