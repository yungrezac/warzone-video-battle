
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
    const url = new URL(req.url);
    
    // Обработка запросов на создание сообщений для шеринга
    if (url.pathname === '/api/telegram-share') {
      return await handleTelegramShare(req);
    }
    
    // Обработка обычных обновлений от Telegram
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

    // Обработка успешного платежа
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const user = update.message.from;
      
      console.log('Обработка успешного платежа:', {
        telegram_payment_charge_id: payment.telegram_payment_charge_id,
        invoice_payload: payment.invoice_payload,
        user_id: user.id
      });

      // Находим пользователя в базе данных
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', user.id.toString())
        .single();

      if (userProfile) {
        // Обрабатываем платеж через нашу функцию
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            user_id: userProfile.id,
            telegram_payment_charge_id: payment.telegram_payment_charge_id,
            telegram_invoice_payload: payment.invoice_payload
          }
        });

        if (error) {
          console.error('Ошибка обработки платежа:', error);
        } else {
          console.log('Платеж обработан успешно:', data);
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
          response = `🏄‍♂️ Добро пожаловать в RollerTricks, ${user.first_name}!\n\nЗдесь вы можете:\n• Загружать видео с трюками\n• Участвовать в конкурсах\n• Получать баллы и призы\n• Общаться с единомышленниками\n\n🎮 Открыть приложение: /app\n💎 Premium подписка: /premium\n❓ Помощь: /help`;
          break;

        case '/app':
          response = '🎮 Откройте приложение RollerTricks через кнопку меню или по ссылке в описании бота!';
          break;

        case '/premium':
          response = '💎 Premium подписка дает вам:\n\n✨ Неограниченную загрузку видео\n🚀 Приоритетное размещение в ленте\n🎯 Эксклюзивные стикеры и значки\n🏆 Доступ к премиум контестам\n📞 Персональную поддержку\n📊 Расширенную статистику\n\n💰 Стоимость: 300 Telegram Stars в месяц\n\nДля оформления подписки используйте приложение!';
          break;

        case '/help':
          response = '❓ Помощь по RollerTricks:\n\n🎮 /app - Открыть приложение\n💎 /premium - Информация о Premium\n📞 /support - Связаться с поддержкой\n\n📱 Основные функции доступны в веб-приложении.\n\nЕсли у вас есть вопросы, обращайтесь к администрации: @rollertricksby';
          break;

        case '/support':
          response = '📞 Поддержка RollerTricks\n\nПо всем вопросам обращайтесь:\n👨‍💼 Администратор: @rollertricksby\n\n⏰ Время ответа: обычно в течение 24 часов\n\n📧 Или опишите вашу проблему здесь, и мы постараемся помочь!';
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
    console.error('Ошибка в telegram-bot:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

const handleTelegramShare = async (req: Request): Promise<Response> => {
  try {
    const { telegramUserId, image, text, initData } = await req.json();
    
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not set');
    }
    
    // Валидируем initData (для безопасности)
    // В продакшене здесь должна быть проверка подписи initData
    
    // Декодируем base64 изображение
    const base64Data = image.split(',')[1]; // Убираем префикс data:image/png;base64,
    const imageData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Создаем FormData для отправки изображения
    const formData = new FormData();
    formData.append('chat_id', telegramUserId.toString());
    formData.append('photo', new Blob([imageData], { type: 'image/png' }), 'trick_share.png');
    formData.append('caption', text);
    formData.append('parse_mode', 'HTML');
    
    // Отправляем изображение через Telegram Bot API
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Ошибка отправки изображения:', result);
      throw new Error(`Telegram API error: ${result.description || 'Unknown error'}`);
    }
    
    console.log('Изображение успешно отправлено пользователю:', telegramUserId);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Изображение отправлено' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('Ошибка в handleTelegramShare:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(serve_handler);
