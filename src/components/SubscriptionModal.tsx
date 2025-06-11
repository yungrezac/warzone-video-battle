
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Check, X } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionModalProps {
  children: React.ReactNode;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { subscription, isPremium, createPayment, isCreatingPayment } = useSubscription();
  const { webApp } = useTelegramWebApp();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!webApp) {
      toast({
        title: "Ошибка",
        description: "Доступно только в Telegram",
        variant: "destructive",
      });
      return;
    }

    try {
      // Создаем прямой инвойс через Telegram WebApp API
      if (webApp.sendInvoice) {
        webApp.sendInvoice({
          title: 'Premium подписка',
          description: 'Месячная премиум подписка на RollerTricks',
          payload: `premium_subscription_${Date.now()}`,
          provider_token: '', // Для Telegram Stars оставляем пустым
          currency: 'XTR', // Telegram Stars
          prices: [
            {
              label: 'Premium подписка',
              amount: 300 // 300 Telegram Stars
            }
          ],
          photo_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
          photo_width: 400,
          photo_height: 300,
          need_name: false,
          need_phone_number: false,
          need_email: false,
          need_shipping_address: false,
          send_phone_number_to_provider: false,
          send_email_to_provider: false,
          is_flexible: false
        }, (status: string) => {
          console.log('Статус платежа:', status);
          if (status === 'paid') {
            toast({
              title: "Успех!",
              description: "Подписка успешно оформлена",
            });
            setIsOpen(false);
          }
        });
      } else {
        // Fallback - создаем счет через нашу функцию
        createPayment();
        
        toast({
          title: "Счет создан",
          description: "Проверьте личные сообщения бота",
        });
      }
      
    } catch (error) {
      console.error('Ошибка создания платежа:', error);
      
      toast({
        title: "Ошибка",
        description: "Не удалось создать счет для оплаты",
        variant: "destructive",
      });
    }
  };

  const premiumFeatures = [
    'Неограниченная загрузка видео',
    'Приоритетное размещение в ленте',
    'Эксклюзивные стикеры и значки',
    'Доступ к премиум контестам',
    'Персональная поддержка',
    'Расширенная статистика профиля'
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Premium подписка
          </DialogTitle>
          <DialogDescription>
            Получите доступ к эксклюзивным функциям
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isPremium ? (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
                  <Crown className="w-5 h-5" />
                  Активная подписка
                </CardTitle>
                <CardDescription className="text-yellow-600">
                  {subscription && `Действует до ${formatDate(subscription.expires_at)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-yellow-700">
                  Спасибо за поддержку! Ваша премиум подписка активна.
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
                  <CardTitle className="text-xl">Premium</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-lg font-bold">300 Stars</span>
                    <span className="text-sm text-gray-500">/месяц</span>
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
                disabled={isCreatingPayment}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                size="lg"
              >
                {isCreatingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Создаем счет...
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    Подписаться за 300 Stars
                  </>
                )}
              </Button>

              <div className="text-xs text-gray-500 text-center">
                Оплата через Telegram Stars. Подписка продлевается автоматически.
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;
