
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
    console.log('📨 Получено обновление от Telegram:', JSON.stringify(update, null, 2));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not set');
    }

    // Обработка успешного платежа (включая рекуррентные подписки)
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const user = update.message.from;
      
      console.log('💰 Обработка успешного платежа:', {
        telegram_payment_charge_id: payment.telegram_payment_charge_id,
        invoice_payload: payment.invoice_payload,
        user_id: user.id,
        total_amount: payment.total_amount,
        currency: payment.currency,
        subscription_expiration_date: payment.subscription_expiration_date,
        is_recurring: payment.is_recurring,
        is_first_recurring: payment.is_first_recurring
      });

      // Находим пользователя в базе данных
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, first_name')
        .eq('telegram_id', user.id.toString())
        .single();

      if (userProfile) {
        // Обрабатываем платеж через нашу функцию
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
        } else {
          console.log('✅ Платеж обработан успешно:', data);
          
          // Отправляем подтверждение пользователю
          const confirmationMessage = payment.is_first_recurring 
            ? `🎉 Поздравляем, ${userProfile.first_name}!\n\n💎 Ваша подписка TRICKS PREMIUM активирована с автоматическим продлением!\n\n✨ Теперь вам доступны все эксклюзивные функции:\n• Приоритетное размещение видео\n• Участие в премиум турнирах\n• Эксклюзивные скидки у партнеров\n• Вывод баллов в USDT\n\n🔄 Подписка будет автоматически продлеваться каждый месяц.`
            : `✅ Ваша подписка TRICKS PREMIUM продлена!\n\nСпасибо за поддержку проекта! 💜`;

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.id,
              text: confirmationMessage,
              parse_mode: 'HTML'
            }),
          });
        }
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
          response = `🏄‍♂️ Добро пожаловать в TRICKS, ${user.first_name}!\n\n🎮 <b>TRICKS</b> - это платформа для любителей экстремальных видов спорта!\n\n✨ <b>Что вас ждет:</b>\n• 📹 Загружайте видео с трюками\n• 🏆 Участвуйте в конкурсах\n• 💰 Получайте баллы и призы\n• 👥 Общайтесь с единомышленниками\n• 🛒 Покупайте товары в маркете\n\n🚀 <b>Команды:</b>\n/app - Открыть приложение\n/premium - Premium подписка\n/help - Помощь`;
          break;

        case '/app':
          response = `🎮 <b>Запускайте TRICKS!</b>\n\n🔗 Откройте приложение через кнопку меню или перейдите по ссылке в описании бота.\n\n✨ В приложении вас ждут:\n• Лента с крутыми видео трюков\n• Турниры с денежными призами\n• Система достижений\n• Маркет с товарами для спорта`;
          break;

        case '/premium':
          response = `💎 <b>TRICKS PREMIUM</b>\n\n🌟 <b>Эксклюзивные возможности:</b>\n• ⭐ Приоритетное размещение в ленте\n• 🏆 Доступ к премиум турнирам\n• 🛍️ Эксклюзивные скидки у партнеров\n• 💵 Вывод баллов в USDT\n• 👑 Специальный значок в профиле\n• 📈 Расширенная статистика\n\n💰 <b>Стоимость:</b> 300 Telegram Stars в месяц\n🔄 <b>Автоматическое продление</b>\n\n📱 Для оформления откройте приложение TRICKS!`;
          break;

        case '/help':
          response = `❓ <b>Помощь TRICKS</b>\n\n📋 <b>Основные команды:</b>\n🎮 /app - Открыть приложение\n💎 /premium - Информация о Premium\n📞 /support - Связаться с поддержкой\n\n📱 <b>Основные функции:</b>\n• Все возможности доступны в веб-приложении\n• Загружайте видео и получайте лайки\n• Участвуйте в турнирах\n• Покупайте товары за баллы\n\n🆘 Нужна помощь? Напишите /support`;
          break;

        case '/support':
          response = `📞 <b>Поддержка TRICKS</b>\n\n👨‍💼 <b>Администратор:</b> @tricksby\n\n⏰ <b>Время ответа:</b> обычно в течение 24 часов\n\n📝 <b>Как получить помощь:</b>\n• Опишите вашу проблему в чате\n• Приложите скриншоты если нужно\n• Укажите ваш username в приложении\n\n💬 Мы всегда готовы помочь!`;
          break;

        case '/stats':
          // Получаем статистику пользователя
          const { data: userProfile } = await supabase
            .from('profiles')
            .select(`
              *,
              user_points (total_points, wins_count)
            `)
            .eq('telegram_id', user.id.toString())
            .single();

          if (userProfile) {
            const points = userProfile.user_points?.[0];
            response = `📊 <b>Ваша статистика в TRICKS</b>\n\n👤 <b>Профиль:</b> ${userProfile.first_name}\n💰 <b>Баллы:</b> ${points?.total_points || 0}\n🏆 <b>Побед:</b> ${points?.wins_count || 0}\n${userProfile.is_premium ? '👑 <b>Premium:</b> Активен' : '⭐ <b>Статус:</b> Обычный'}\n\n🎮 Откройте приложение для подробной статистики!`;
          } else {
            response = `📊 <b>Статистика недоступна</b>\n\nСначала зайдите в приложение TRICKS, чтобы создать профиль!\n\n🎮 /app - Открыть приложение`;
          }
          break;

        default:
          if (text.startsWith('/')) {
            response = `❓ <b>Неизвестная команда</b>\n\n📋 <b>Доступные команды:</b>\n🎮 /app - Открыть приложение\n💎 /premium - Premium подписка\n📊 /stats - Ваша статистика\n❓ /help - Помощь\n📞 /support - Поддержка`;
          } else {
            // Обрабатываем обычные сообщения как обращение в поддержку
            response = `💬 <b>Спасибо за сообщение!</b>\n\nВаше сообщение передано в службу поддержки. Мы ответим в ближайшее время.\n\n📞 Для срочных вопросов: @tricksby\n🎮 Основные функции: /app`;
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
      
      console.log('🔍 Pre-checkout query:', {
        id: preCheckoutQuery.id,
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

    // Обработка callback_query (inline кнопки)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id;
      
      console.log('🔘 Callback query:', callbackQuery.data);

      // Подтверждаем получение callback
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: 'Команда получена!'
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
