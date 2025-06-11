
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Crown, AlertCircle, Banknote } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWithdrawal } from '@/hooks/useWithdrawal';
import { useToast } from '@/hooks/use-toast';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose }) => {
  const { isPremium } = useSubscription();
  const { data: userProfile } = useUserProfile();
  const { createWithdrawalRequest, isCreatingRequest, withdrawalHistory } = useWithdrawal();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    amount_points: '',
    phone_number: '',
    recipient_name: '',
    bank_name: 'СБП',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateRubles = (points: number) => {
    return (points / 100) * 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const points = parseInt(formData.amount_points);
    
    if (points < 100000) {
      toast({
        title: "Ошибка",
        description: "Минимальная сумма для вывода: 100,000 баллов",
        variant: "destructive",
      });
      return;
    }

    if (!userProfile || userProfile.total_points < points) {
      toast({
        title: "Ошибка",
        description: "Недостаточно баллов",
        variant: "destructive",
      });
      return;
    }

    try {
      await createWithdrawalRequest({
        amount_points: points,
        phone_number: formData.phone_number,
        recipient_name: formData.recipient_name,
        bank_name: formData.bank_name,
      });

      toast({
        title: "Успех!",
        description: "Заявка на вывод средств создана",
      });

      setFormData({
        amount_points: '',
        phone_number: '',
        recipient_name: '',
        bank_name: 'СБП',
      });
      
      onClose();
    } catch (error: any) {
      console.error('Ошибка создания заявки:', error);
      
      let errorMessage = "Ошибка при создании заявки";
      
      if (error.message?.includes('Premium subscription required')) {
        errorMessage = "Требуется Premium подписка";
      } else if (error.message?.includes('Insufficient points')) {
        errorMessage = "Недостаточно баллов";
      } else if (error.message?.includes('Minimum withdrawal amount')) {
        errorMessage = "Минимальная сумма для вывода: 100,000 баллов";
      }

      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Ожидает', variant: 'secondary' as const },
      approved: { label: 'Одобрено', variant: 'default' as const },
      rejected: { label: 'Отклонено', variant: 'destructive' as const },
      completed: { label: 'Выполнено', variant: 'secondary' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-green-500" />
            Вывод средств
          </DialogTitle>
          <DialogDescription>
            Обмен баллов на рубли для Premium пользователей
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Информация о курсе */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                Курс обмена
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg font-bold text-blue-700">100 баллов = 10 ₽</div>
              <div className="text-sm text-blue-600 mt-1">
                Минимум для вывода: 100,000 баллов (10,000 ₽)
              </div>
            </CardContent>
          </Card>

          {/* Текущий баланс */}
          <Card>
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ваш баланс:</span>
                <div className="text-right">
                  <div className="font-bold">{userProfile?.total_points?.toLocaleString() || 0} баллов</div>
                  <div className="text-sm text-gray-500">
                    ≈ {calculateRubles(userProfile?.total_points || 0).toLocaleString()} ₽
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isPremium ? (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
                  <Crown className="w-4 h-4" />
                  Premium функция
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-700">
                    Обмен баллов на рубли доступен только для Premium пользователей. 
                    Подключите Premium подписку для получения доступа к этой функции.
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Форма вывода */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Заявка на вывод</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <Label htmlFor="amount" className="text-sm">Количество баллов</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="100000"
                        value={formData.amount_points}
                        onChange={(e) => handleInputChange('amount_points', e.target.value)}
                        placeholder="100000"
                        className="mt-1"
                      />
                      {formData.amount_points && (
                        <div className="text-xs text-gray-500 mt-1">
                          К получению: {calculateRubles(parseInt(formData.amount_points) || 0).toLocaleString()} ₽
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="recipient" className="text-sm">Имя получателя</Label>
                      <Input
                        id="recipient"
                        value={formData.recipient_name}
                        onChange={(e) => handleInputChange('recipient_name', e.target.value)}
                        placeholder="Иван Иванов"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm">Номер телефона (СБП)</Label>
                      <Input
                        id="phone"
                        value={formData.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        placeholder="+7 900 123 45 67"
                        className="mt-1"
                      />
                    </div>

                    <Button 
                      type="submit"
                      disabled={isCreatingRequest || !formData.amount_points || !formData.recipient_name || !formData.phone_number}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isCreatingRequest ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Создаем заявку...
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4 mr-2" />
                          Создать заявку
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* История выводов */}
              {withdrawalHistory && withdrawalHistory.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">История выводов</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {withdrawalHistory.slice(0, 3).map((request) => (
                        <div key={request.id} className="flex justify-between items-center text-sm border-b pb-2">
                          <div>
                            <div className="font-medium">{request.amount_rubles.toLocaleString()} ₽</div>
                            <div className="text-xs text-gray-500">{formatDate(request.created_at)}</div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalModal;
