
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateWithdrawalRequest } from '@/hooks/useWithdrawal';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WithdrawalDialog: React.FC<WithdrawalDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [amountPoints, setAmountPoints] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [recipientName, setRecipientName] = useState('');

  const { data: profile } = useUserProfile();
  const createWithdrawal = useCreateWithdrawalRequest();

  const amountRubles = Math.floor(Number(amountPoints) / 10);
  const minWithdrawal = 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const points = Number(amountPoints);
    
    if (points < minWithdrawal) {
      toast.error(`Минимальная сумма для вывода: ${minWithdrawal} баллов`);
      return;
    }

    if (!profile || points > profile.total_points) {
      toast.error('Недостаточно баллов');
      return;
    }

    if (!phoneNumber || !bankName || !recipientName) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      await createWithdrawal.mutateAsync({
        amountPoints: points,
        phoneNumber,
        bankName,
        recipientName,
      });
      
      // Очищаем форму и закрываем диалог
      setAmountPoints('');
      setPhoneNumber('');
      setBankName('');
      setRecipientName('');
      onOpenChange(false);
    } catch (error) {
      console.error('Ошибка создания заявки:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Заявка на вывод</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Количество баллов</Label>
            <Input
              id="amount"
              type="number"
              min={minWithdrawal}
              max={profile?.total_points || 0}
              value={amountPoints}
              onChange={(e) => setAmountPoints(e.target.value)}
              placeholder={`Минимум ${minWithdrawal} баллов`}
            />
            {amountPoints && (
              <p className="text-sm text-gray-600 mt-1">
                К выводу: {amountRubles} рублей (курс: 100 баллов = 10₽)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Номер телефона (СБП)</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div>
            <Label htmlFor="bank">Наименование банка</Label>
            <Input
              id="bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Например: Сбербанк"
            />
          </div>

          <div>
            <Label htmlFor="recipient">Имя получателя</Label>
            <Input
              id="recipient"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Фамилия Имя Отчество"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={createWithdrawal.isPending}
              className="flex-1"
            >
              {createWithdrawal.isPending ? 'Создание...' : 'Создать заявку'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
