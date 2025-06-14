
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWithdrawal } from '@/hooks/useWithdrawal';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';
import { Loader2, DollarSign, CreditCard, Phone, User, Wallet } from 'lucide-react';
import PremiumBadge from './PremiumBadge';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPoints: number;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, userPoints }) => {
  const [withdrawalType, setWithdrawalType] = useState<'bank' | 'crypto'>('bank');
  
  // Банковские реквизиты
  const [bankAmount, setBankAmount] = useState<number>(0);
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankName, setBankName] = useState('');
  
  // Крипто реквизиты
  const [cryptoAmount, setCryptoAmount] = useState<number>(0);
  const [walletAddress, setWalletAddress] = useState('');
  
  const { createWithdrawalRequest, isCreatingRequest, pointToRubleRate, pointToUsdtRate, isPremium } = useWithdrawal();
  const { user } = useAuth();

  const minBankWithdrawal = 1000; // Минимум 1000 баллов для банка
  const minCryptoWithdrawal = 100000; // Минимум 100000 баллов для крипто

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Необходима авторизация');
      return;
    }

    try {
      if (withdrawalType === 'bank') {
        // Проверки для банковского вывода
        if (bankAmount < minBankWithdrawal) {
          toast.error(`Минимальная сумма для вывода: ${minBankWithdrawal} баллов`);
          return;
        }

        if (bankAmount > userPoints) {
          toast.error('Недостаточно баллов');
          return;
        }

        if (!recipientName.trim() || !phoneNumber.trim() || !bankName.trim()) {
          toast.error('Заполните все поля');
          return;
        }

        await createWithdrawalRequest.mutateAsync({
          withdrawal_type: 'bank',
          amount_points: bankAmount,
          amount_usdt: bankAmount * pointToRubleRate,
          recipient_name: recipientName.trim(),
          phone_number: phoneNumber.trim(),
          bank_name: bankName.trim(),
          wallet_address: '',
        });
      } else {
        // Проверки для крипто-вывода
        if (!isPremium) {
          toast.error('Вывод в USDT доступен только для Premium пользователей');
          return;
        }
        
        if (cryptoAmount < minCryptoWithdrawal) {
          toast.error(`Минимальная сумма для вывода: ${minCryptoWithdrawal} баллов`);
          return;
        }

        if (cryptoAmount > userPoints) {
          toast.error('Недостаточно баллов');
          return;
        }

        if (!walletAddress.trim()) {
          toast.error('Введите USDT адрес кошелька');
          return;
        }

        await createWithdrawalRequest.mutateAsync({
          withdrawal_type: 'crypto',
          amount_points: cryptoAmount,
          amount_usdt: cryptoAmount * pointToUsdtRate,
          wallet_address: walletAddress.trim(),
          recipient_name: '',
          phone_number: '',
          bank_name: '',
        });
      }

      toast.success('Заявка на вывод создана успешно!');
      onClose();
      
      // Сбрасываем форму
      setBankAmount(0);
      setCryptoAmount(0);
      setRecipientName('');
      setPhoneNumber('');
      setBankName('');
      setWalletAddress('');
      
    } catch (error) {
      console.error('Ошибка создания заявки:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка при создании заявки на вывод');
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
        
        <Tabs defaultValue="bank" value={withdrawalType} onValueChange={(value) => setWithdrawalType(value as 'bank' | 'crypto')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank">Банк</TabsTrigger>
            <TabsTrigger value="crypto" disabled={!isPremium} className="relative">
              USDT
              {!isPremium && (
                <div className="absolute -top-1 -right-1">
                  <PremiumBadge size="xs" />
                </div>
              )}
            </TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Доступно:</strong> {userPoints} баллов
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {withdrawalType === 'bank' && (
                  <>Курс: 1 балл = {pointToRubleRate} ₽ (мин. {minBankWithdrawal} баллов)</>
                )}
                {withdrawalType === 'crypto' && (
                  <>Курс: 100000 баллов = 1 USDT (мин. {minCryptoWithdrawal} баллов)</>
                )}
              </p>
            </div>

            <TabsContent value="bank" className="space-y-4 mt-0 pt-0">
              <div>
                <Label htmlFor="bankAmount">Сумма к выводу (в баллах)</Label>
                <Input
                  id="bankAmount"
                  type="number"
                  value={bankAmount || ''}
                  onChange={(e) => setBankAmount(Number(e.target.value))}
                  placeholder={`Минимум ${minBankWithdrawal}`}
                  min={minBankWithdrawal}
                  max={userPoints}
                  disabled={isCreatingRequest}
                />
                {bankAmount > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    К выводу: {(bankAmount * pointToRubleRate).toFixed(2)} ₽
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
            </TabsContent>
            
            <TabsContent value="crypto" className="space-y-4 mt-0 pt-0">
              {!isPremium ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <PremiumBadge size="md" className="mx-auto mb-2" />
                  <h3 className="font-semibold text-yellow-800 mb-1">Требуется Premium подписка</h3>
                  <p className="text-sm text-yellow-700">
                    Вывод средств в USDT доступен только пользователям с Premium подпиской
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="cryptoAmount">Сумма к выводу (в баллах)</Label>
                    <Input
                      id="cryptoAmount"
                      type="number"
                      value={cryptoAmount || ''}
                      onChange={(e) => setCryptoAmount(Number(e.target.value))}
                      placeholder={`Минимум ${minCryptoWithdrawal}`}
                      min={minCryptoWithdrawal}
                      max={userPoints}
                      disabled={isCreatingRequest}
                    />
                    {cryptoAmount > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        К выводу: {(cryptoAmount * pointToUsdtRate).toFixed(4)} USDT
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="walletAddress" className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      USDT Адрес кошелька (TRC20)
                    </Label>
                    <Input
                      id="walletAddress"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="TPY6Wv7...Kj2Qb"
                      disabled={isCreatingRequest}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Укажите адрес в сети TRON (TRC20)
                    </p>
                  </div>
                </>
              )}
            </TabsContent>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Обработка заявки:</h4>
              <ul className="text-xs text-yellow-700 space-y-0.5">
                <li>• Заявки обрабатываются в течение 1-3 рабочих дней</li>
                <li>• {withdrawalType === 'bank' ? 'Средства поступают на карту' : 'Транзакция USDT'} в течение 1-5 рабочих дней</li>
                {withdrawalType === 'bank' && (
                  <li>• Комиссия банка может составлять 1-3%</li>
                )}
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
                disabled={
                  isCreatingRequest || 
                  (withdrawalType === 'bank' && (bankAmount < minBankWithdrawal || bankAmount > userPoints)) ||
                  (withdrawalType === 'crypto' && (!isPremium || cryptoAmount < minCryptoWithdrawal || cryptoAmount > userPoints))
                }
                className="flex-1"
              >
                {isCreatingRequest && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Создать заявку
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalModal;
