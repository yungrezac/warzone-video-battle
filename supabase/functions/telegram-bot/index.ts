
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log('Получено обновление от Telegram:', JSON.stringify(update, null, 2));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not set');
    }

    // Обработка успешного платежа с полной поддержкой подписок
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const user = update.message.from;
      
      console.log('🎯 Обработка успешного платежа:', {
        telegram_payment_charge_id: payment.telegram_payment_charge_id,
        invoice_payload: payment.invoice_payload,
        user_id: user.id,
        subscription_expiration_date: payment.subscription_expiration_date,
        is_recurring: payment.is_recurring,
        is_first_recurring: payment.is_first_recurring,
        total_amount: payment.total_amount,
        currency: payment.currency
      });

      // Находим пользователя в базе данных
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', user.id.toString())
        .single();

      if (userProfile) {
        console.log('👤 Найден профиль пользователя:', userProfile.id);
        
        // Обрабатываем платеж через нашу функцию с полной поддержкой подписок
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            user_id: userProfile.id,
            telegram_payment_charge_id: payment.telegram_payment_charge_id,
            telegram_invoice_payload: payment.invoice_payload,
            subscription_expiration_date: payment.subscription_expiration_date,
            is_recurring: payment.is_recurring || false,
            is_first_recurring: payment.is_first_recurring || false
          }
        });

        if (error) {
          console.error('❌ Ошибка обработки платежа:', error);
          
          // Отправляем сообщение об ошибке пользователю
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.id,
              text: `❌ Произошла ошибка при обработке вашего платежа. Пожалуйста, обратитесь в поддержку.\n\nID платежа: ${payment.telegram_payment_charge_id}`,
              parse_mode: 'HTML'
            }),
          });
        } else {
          console.log('✅ Платеж обработан успешно:', data);
          
          // Отправляем подтверждение успешного платежа
          const successMessage = payment.is_first_recurring 
            ? `🎉 Поздравляем, ${user.first_name}!\n\n💎 Ваша подписка TRICKS PREMIUM активирована с автоматическим продлением!\n\n✨ Теперь вам доступны все эксклюзивные функции:\n• Эксклюзивные скидки у партнёров\n• Участие в турнирах\n• Вывод баллов в USDT\n• Премиум значок\n• Добавление товаров в маркет\n\n🔄 Подписка будет автоматически продлеваться каждый месяц за 1 ⭐`
            : `✅ Подписка TRICKS PREMIUM продлена!\n\n💎 Ваша подписка активна\n🔄 Автоматическое продление: включено\n\nСпасибо за поддержку!`;

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.id,
              text: successMessage,
              parse_mode: 'HTML'
            }),
          });
        }
      } else {
        console.error('❌ Пользователь не найден в базе данных:', user.id);
      }
    }

    // Обработка команд
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const user = update.message.from;

      let response = '';

      switch (text) {
        case '/start':
          response = `🏄‍♂️ Добро пожаловать в TRICKS, ${user.first_name}!\n\nЗдесь вы можете:\n• Загружать видео с трюками\n• Участвовать в конкурсах\n• Получать баллы и призы\n• Общаться с единомышленниками\n\n🎮 Открыть приложение: /app\n💎 Premium подписка: /premium\n❓ Помощь: /help`;
          break;

        case '/app':
          response = '🎮 Откройте приложение TRICKS через кнопку меню или по ссылке в описании бота!';
          break;

        case '/premium':
          response = '💎 TRICKS PREMIUM дает вам:\n\n✨ Эксклюзивные скидки у партнёров\n🏆 Участие в онлайн и офлайн турнирах\n🎉 Приглашения на закрытые мероприятия\n💰 Вывод баллов в USDT\n👑 Специальный значок премиум-пользователя\n🛍️ Возможность добавлять товары в маркет\n\n💰 Стоимость: всего 1 ⭐ в месяц\n🔄 С автоматическим продлением\n\nДля оформления подписки используйте приложение!';
          break;

        case '/help':
          response = '❓ Помощь по TRICKS:\n\n🎮 /app - Открыть приложение\n💎 /premium - Информация о Premium\n📞 /support - Связаться с поддержкой\n\n📱 Основные функции доступны в веб-приложении.\n\nЕсли у вас есть вопросы, обращайтесь к администрации: @tricksby';
          break;

        case '/support':
          response = '📞 Поддержка TRICKS\n\nПо всем вопросам обращайтесь:\n👨‍💼 Администратор: @tricksby\n\n⏰ Время ответа: обычно в течение 24 часов\n\n📧 Или опишите вашу проблему здесь, и мы постараемся помочь!';
          break;

        default:
          if (text.startsWith('/')) {
            response = '❓ Неизвестная команда. Доступные команды:\n\n🎮 /app - Открыть приложение\n💎 /premium - Premium подписка\n❓ /help - Помощь\n📞 /support - Поддержка';
          }
          break;
      }

      if (response) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: response,
            parse_mode: 'HTML'
          }),
        });
      }
    }

    // Обработка pre_checkout_query для подтверждения платежа
    if (update.pre_checkout_query) {
      const preCheckoutQuery = update.pre_checkout_query;
      
      console.log('💳 Подтверждение платежа:', {
        id: preCheckoutQuery.id,
        from: preCheckoutQuery.from,
        currency: preCheckoutQuery.currency,
        total_amount: preCheckoutQuery.total_amount,
        invoice_payload: preCheckoutQuery.invoice_payload
      });
      
      await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: preCheckoutQuery.id,
          ok: true
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Ошибка в telegram-bot:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(serve_handler);
