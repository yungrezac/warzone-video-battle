
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Check, X, Loader2, CheckCircle2, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionModalProps {
  children: React.ReactNode;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'default' | 'processing' | 'status'>('default');
  const [paymentResult, setPaymentResult] = useState<{ status: string; title: string; description: string } | null>(null);

  const { subscription, isPremium, createInvoice, isCreatingInvoice } = useSubscription();
  const { webApp } = useTelegramWebApp();
  const { toast } = useToast();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state on close after animation
      setTimeout(() => {
        setView('default');
        setPaymentResult(null);
      }, 300);
    }
  };

  const handleSubscribe = async () => {
    if (!webApp) {
      toast({
        title: "Ошибка",
        description: "Доступно только в Telegram",
        variant: "destructive",
      });
      return;
    }

    setView('processing');

    try {
      console.log('🎯 Создаем рекуррентный инвойс для подписки...');
      
      const invoiceData = await createInvoice();
      console.log('📄 Данные рекуррентного инвойса:', invoiceData);

      if (!invoiceData?.invoice_url) {
        throw new Error('Не удалось получить URL инвойса');
      }

      console.log('💳 Открываем рекуррентный инвойс через webApp.openInvoice...');
      console.log('🔗 URL инвойса:', invoiceData.invoice_url);

      // Устанавливаем таймаут для обработки случаев зависания
      const paymentTimeout = setTimeout(() => {
        console.log('⏰ Таймаут платежа - возвращаемся к главному экрану');
        setPaymentResult({
          status: 'timeout',
          title: "Время ожидания истекло",
          description: "Платеж не был завершен. Попробуйте еще раз.",
        });
        setView('status');
      }, 60000); // 60 секунд

      if (webApp.openInvoice) {
        webApp.openInvoice(invoiceData.invoice_url, (status: string) => {
          clearTimeout(paymentTimeout);
          console.log('💰 Статус платежа от Telegram:', status);
          
          if (status === 'paid') {
            setPaymentResult({
              status,
              title: "Успех!",
              description: invoiceData.is_recurring 
                ? "Подписка TRICKS PREMIUM успешно оформлена с автоматическим продлением! Теперь вам доступны все премиум функции."
                : "Подписка TRICKS PREMIUM успешно оформлена! Спасибо за поддержку!",
            });
            toast({
              title: "Успех!",
              description: "Подписка успешно оформлена",
            });
          } else if (status === 'cancelled') {
            setPaymentResult({
              status,
              title: "Платеж отменен",
              description: "Вы отменили платеж. Вы можете попробовать оформить подписку еще раз.",
            });
            toast({
              title: "Платеж отменен",
              description: "Вы можете попробовать еще раз",
            });
          } else if (status === 'failed') {
            setPaymentResult({
              status,
              title: "Ошибка платежа",
              description: "Не удалось обработать платеж. Проверьте баланс Telegram Stars и попробуйте снова.",
            });
            toast({
              title: "Ошибка платежа",
              description: "Проверьте баланс Stars и попробуйте еще раз",
              variant: "destructive",
            });
          } else {
            setPaymentResult({
              status: 'unknown',
              title: "Неизвестный статус",
              description: `Получен неожиданный статус: ${status}. Обратитесь в поддержку.`,
            });
          }
          setView('status');
        });
      } else {
        clearTimeout(paymentTimeout);
        // Fallback: открываем ссылку в браузере
        console.log('🔗 Fallback: открываем ссылку...');
        if (webApp.openLink) {
          webApp.openLink(invoiceData.invoice_url);
        } else {
          window.open(invoiceData.invoice_url, '_blank');
        }
        
        toast({
          title: "Инвойс создан",
          description: "Откройте ссылку для оплаты подписки",
        });
        setIsOpen(false);
      }
      
    } catch (error) {
      console.error('❌ Ошибка создания платежа:', error);
      
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать счет для оплаты",
        variant: "destructive",
      });
      setView('default');
    }
  };

  const premiumFeatures = [
    'Эксклюзивные скидки у партнёров TRICKS',
    'Участие в онлайн и офлайн турнирах',
    'Приглашения на закрытые мероприятия',
    'Вывод баллов в USDT',
    'Специальный значок премиум-пользователя',
    'Возможность добавлять свой товар в маркет',
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md !rounded-xl">
        {view === 'default' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                TRICKS PREMIUM
              </DialogTitle>
              <DialogDescription>
                Получите доступ ко всем эксклюзивным функциям TRICKS
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {isPremium ? (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
                      <Crown className="w-5 h-5" />
                      Активная подписка
                      <Badge variant="outline" className="ml-auto">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Автопродление
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-yellow-600">
                      {subscription && `Действует до ${formatDate(subscription.expires_at)}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-yellow-700">
                      Спасибо за поддержку! Ваша подписка TRICKS PREMIUM активна с автоматическим продлением.
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardHeader className="text-center pb-3">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-2">
                        <Crown className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">TRICKS PREMIUM</CardTitle>
                      <CardDescription className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-lg font-bold">1 Star</span>
                        <span className="text-sm text-gray-500">/месяц</span>
                        <Badge variant="outline" className="ml-2">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Автопродление
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {premiumFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Button 
                    onClick={handleSubscribe}
                    disabled={isCreatingInvoice}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    size="lg"
                  >
                    {isCreatingInvoice ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Создаем счет...
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-2" />
                        Оформить за 1 ⭐
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-gray-500 text-center">
                    Оплата через Telegram Stars. Подписка с автоматическим продлением каждый месяц.
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {view === 'processing' && (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 min-h-[300px]">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <h3 className="text-lg font-semibold">Ожидание платежа</h3>
            <p className="text-sm text-gray-500">
              Пожалуйста, подтвердите оплату в открывшемся окне Telegram.
            </p>
            <div className="text-xs text-gray-400">
              Стоимость: 1 ⭐ Telegram Star
            </div>
          </div>
        )}

        {view === 'status' && paymentResult && (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 min-h-[300px]">
            {paymentResult.status === 'paid' && <CheckCircle2 className="w-12 h-12 text-green-500" />}
            {paymentResult.status === 'cancelled' && <Info className="w-12 h-12 text-yellow-500" />}
            {(paymentResult.status === 'failed' || paymentResult.status === 'timeout' || paymentResult.status === 'unknown') && <AlertTriangle className="w-12 h-12 text-red-500" />}
            
            <h3 className="text-lg font-semibold">{paymentResult.title}</h3>
            <p className="text-sm text-gray-500">{paymentResult.description}</p>
            
            <div className="flex gap-2 pt-4 w-full">
              {paymentResult.status === 'paid' ? (
                <Button className="w-full" onClick={() => window.location.reload()}>
                  Отлично!
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                    Закрыть
                  </Button>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" onClick={() => setView('default')}>
                    Попробовать снова
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;
