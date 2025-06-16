
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
    console.log('🎯 Получено обновление от Telegram:', JSON.stringify(update, null, 2));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not set');
    }

    // Функция для отправки сообщений
    const sendMessage = async (chatId: number, text: string, options: any = {}) => {
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            ...options
          }),
        });
        
        const result = await response.json();
        if (!result.ok) {
          console.error('❌ Ошибка отправки сообщения:', result);
        }
        return result;
      } catch (error) {
        console.error('❌ Ошибка при отправке сообщения:', error);
      }
    };

    // Обработка успешного платежа с полной поддержкой подписок
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const user = update.message.from;
      
      console.log('💰 Обработка успешного платежа:', {
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
          
          await sendMessage(user.id, 
            `❌ Произошла ошибка при обработке вашего платежа. Пожалуйста, обратитесь в поддержку.\n\n` +
            `💳 ID платежа: <code>${payment.telegram_payment_charge_id}</code>\n` +
            `📞 Поддержка: @tricksby`
          );
        } else {
          console.log('✅ Платеж обработан успешно:', data);
          
          // Отправляем подтверждение успешного платежа
          const successMessage = payment.is_first_recurring 
            ? `🎉 Поздравляем, ${user.first_name}!\n\n` +
              `💎 Ваша подписка TRICKS PREMIUM активирована с автоматическим продлением!\n\n` +
              `✨ Теперь вам доступны все эксклюзивные функции:\n` +
              `• 🎁 Эксклюзивные скидки у партнёров\n` +
              `• 🏆 Участие в турнирах\n` +
              `• 💰 Вывод баллов в USDT\n` +
              `• 👑 Премиум значок\n` +
              `• 🛍️ Добавление товаров в маркет\n\n` +
              `🔄 Подписка будет автоматически продлеваться каждый месяц за 1 ⭐\n\n` +
              `🎮 Откройте приложение: /app`
            : `✅ Подписка TRICKS PREMIUM продлена!\n\n` +
              `💎 Ваша подписка активна\n` +
              `🔄 Автоматическое продление: включено\n\n` +
              `Спасибо за поддержку!\n\n` +
              `🎮 Откройте приложение: /app`;

          await sendMessage(user.id, successMessage);
        }
      } else {
        console.error('❌ Пользователь не найден в базе данных:', user.id);
        
        await sendMessage(user.id, 
          `❌ Ошибка: ваш профиль не найден в системе.\n\n` +
          `Пожалуйста, сначала откройте приложение TRICKS через /app и создайте профиль.\n\n` +
          `📞 Если проблема не решается, обратитесь в поддержку: @tricksby`
        );
      }
    }

    // Обработка команд и сообщений
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const user = update.message.from;

      console.log(`📨 Получена команда: ${text} от пользователя ${user.id}`);

      let response = '';
      let replyMarkup = null;

      switch (text) {
        case '/start':
          response = `🏄‍♂️ Добро пожаловать в TRICKS, ${user.first_name}!\n\n` +
                    `🎪 TRICKS — это социальная платформа для любителей экстремальных видов спорта!\n\n` +
                    `🎯 Здесь вы можете:\n` +
                    `• 📹 Загружать видео с трюками\n` +
                    `• 🏆 Участвовать в конкурсах и турнирах\n` +
                    `• 💰 Получать баллы и призы\n` +
                    `• 👥 Общаться с единомышленниками\n` +
                    `• 🛍️ Покупать товары в маркете\n\n` +
                    `🚀 Выберите действие:`;
          
          replyMarkup = {
            inline_keyboard: [
              [{ text: '🎮 Открыть приложение', web_app: { url: 'https://cibytresc-wntdgxqjpfm.lovableproject.com' } }],
              [{ text: '💎 Premium подписка', callback_data: 'premium_info' }],
              [{ text: '❓ Помощь', callback_data: 'help' }]
            ]
          };
          break;

        case '/app':
          response = `🎮 Добро пожаловать в TRICKS!\n\n` +
                    `Нажмите кнопку ниже, чтобы открыть приложение:`;
          
          replyMarkup = {
            inline_keyboard: [
              [{ text: '🚀 Открыть TRICKS', web_app: { url: 'https://cibytresc-wntdgxqjpfm.lovableproject.com' } }]
            ]
          };
          break;

        case '/premium':
          response = `💎 TRICKS PREMIUM — Максимум возможностей!\n\n` +
                    `🌟 Что дает Premium подписка:\n\n` +
                    `✨ Эксклюзивные скидки у партнёров TRICKS\n` +
                    `🏆 Участие в онлайн и офлайн турнирах\n` +
                    `🎉 Приглашения на закрытые мероприятия\n` +
                    `💰 Вывод баллов в USDT\n` +
                    `👑 Специальный значок премиум-пользователя\n` +
                    `🛍️ Возможность добавлять товары в маркет\n\n` +
                    `💰 Стоимость: всего 1 ⭐ в месяц\n` +
                    `🔄 С автоматическим продлением\n\n` +
                    `Для оформления подписки откройте приложение!`;
          
          replyMarkup = {
            inline_keyboard: [
              [{ text: '🎮 Оформить Premium', web_app: { url: 'https://cibytresc-wntdgxqjpfm.lovableproject.com' } }]
            ]
          };
          break;

        case '/help':
          response = `❓ Помощь по TRICKS\n\n` +
                    `🎮 /app — Открыть приложение\n` +
                    `💎 /premium — Информация о Premium\n` +
                    `📊 /stats — Ваша статистика\n` +
                    `🛍️ /market — Маркет товаров\n` +
                    `🏆 /tournaments — Турниры\n` +
                    `📞 /support — Связаться с поддержкой\n\n` +
                    `📱 Основные функции доступны в веб-приложении.\n\n` +
                    `❓ Если у вас есть вопросы, обращайтесь к администрации: @tricksby`;
          break;

        case '/support':
          response = `📞 Поддержка TRICKS\n\n` +
                    `По всем вопросам обращайтесь:\n` +
                    `👨‍💼 Администратор: @tricksby\n\n` +
                    `⏰ Время ответа: обычно в течение 24 часов\n\n` +
                    `📧 Или опишите вашу проблему здесь, и мы постараемся помочь!\n\n` +
                    `🎮 Также вы можете воспользоваться приложением:`;
          
          replyMarkup = {
            inline_keyboard: [
              [{ text: '🎮 Открыть приложение', web_app: { url: 'https://cibytresc-wntdgxqjpfm.lovableproject.com' } }]
            ]
          };
          break;

        case '/stats':
          // Получаем статистику пользователя
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('telegram_id', user.id.toString())
            .single();

          if (userProfile) {
            const { data: userPoints } = await supabase
              .from('user_points')
              .select('total_points')
              .eq('user_id', userProfile.id)
              .single();

            response = `📊 Ваша статистика в TRICKS\n\n` +
                      `👤 Пользователь: ${userProfile.first_name || 'Неизвестно'}\n` +
                      `💰 Баллы: ${userPoints?.total_points || 0}\n` +
                      `💎 Premium: ${userProfile.is_premium ? '✅ Активен' : '❌ Не активен'}\n` +
                      `👥 Подписчики: ${userProfile.followers_count || 0}\n` +
                      `📺 Подписки: ${userProfile.following_count || 0}\n\n` +
                      `🎮 Откройте приложение для подробной статистики:`;
            
            replyMarkup = {
              inline_keyboard: [
                [{ text: '📊 Подробная статистика', web_app: { url: 'https://cibytresc-wntdgxqjpfm.lovableproject.com' } }]
              ]
            };
          } else {
            response = `📊 Статистика недоступна\n\n` +
                      `Сначала создайте профиль в приложении TRICKS:`;
            
            replyMarkup = {
              inline_keyboard: [
                [{ text: '🎮 Создать профиль', web_app: { url: 'https://cibytresc-wntdgxqjpfm.lovableproject.com' } }]
              ]
            };
          }
          break;

        case '/market':
          response = `🛍️ Маркет TRICKS\n\n` +
                    `В маркете вы можете:\n` +
                    `• 🎁 Покупать товары за баллы\n` +
                    `• 👕 Находить эксклюзивную одежду\n` +
                    `• 🛹 Покупать оборудование для трюков\n` +
                    `• 💎 Premium пользователи могут добавлять свои товары\n\n` +
                    `Откройте приложение для просмотра маркета:`;
          
          replyMarkup = {
            inline_keyboard: [
              [{ text: '🛍️ Открыть маркет', web_app: { url: 'https://cibytresc-wntdgxqjpfm.lovableproject.com' } }]
            ]
          };
          break;

        case '/tournaments':
          response = `🏆 Турниры TRICKS\n\n` +
                    `Участвуйте в турнирах и выигрывайте призы:\n` +
                    `• 🥇 Еженедельные конкурсы видео\n` +
                    `• 🎪 Онлайн турниры по трюкам\n` +
                    `• 🏅 Офлайн мероприятия (Premium)\n` +
                    `• 💰 Денежные призы\n\n` +
                    `Откройте приложение для участия:`;
          
          replyMarkup = {
            inline_keyboard: [
              [{ text: '🏆 Участвовать в турнирах', web_app: { url: 'https://cibytresc-wntdgxqjpfm.lovableproject.com' } }]
            ]
          };
          break;

        default:
          if (text.startsWith('/')) {
            response = `❓ Неизвестная команда: ${text}\n\n` +
                      `Доступные команды:\n` +
                      `🎮 /app — Открыть приложение\n` +
                      `💎 /premium — Premium подписка\n` +
                      `📊 /stats — Ваша статистика\n` +
                      `🛍️ /market — Маркет товаров\n` +
                      `🏆 /tournaments — Турниры\n` +
                      `❓ /help — Помощь\n` +
                      `📞 /support — Поддержка`;
          } else {
            // Обработка обычных сообщений
            response = `Привет, ${user.first_name}! 👋\n\n` +
                      `Я бот TRICKS. Для работы с платформой используйте команды или откройте приложение:\n\n` +
                      `🎮 /app — Открыть приложение\n` +
                      `❓ /help — Список всех команд`;
          }
          break;
      }

      if (response) {
        await sendMessage(chatId, response, replyMarkup ? { reply_markup: replyMarkup } : {});
      }
    }

    // Обработка callback query (нажатия на inline кнопки)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data;
      const user = callbackQuery.from;

      console.log(`🔘 Получен callback: ${data} от пользователя ${user.id}`);

      let response = '';
      let replyMarkup = null;

      switch (data) {
        case 'premium_info':
          response = `💎 TRICKS PREMIUM\n\n` +
                    `🌟 Преимущества Premium подписки:\n\n` +
                    `✨ Эксклюзивные скидки у партнёров\n` +
                    `🏆 Участие в онлайн и офлайн турнирах\n` +
                    `🎉 Приглашения на закрытые мероприятия\n` +
                    `💰 Вывод баллов в USDT\n` +
                    `👑 Специальный значок премиум-пользователя\n` +
                    `🛍️ Возможность добавлять товары в маркет\n\n` +
                    `💰 Стоимость: 1 ⭐ в месяц с автопродлением`;
          
          replyMarkup = {
            inline_keyboard: [
              [{ text: '🎮 Оформить Premium', web_app: { url: 'https://cibytresc-wntdgxqjpfm.lovableproject.com' } }]
            ]
          };
          break;

        case 'help':
          response = `❓ Помощь по TRICKS\n\n` +
                    `TRICKS — платформа для любителей экстремальных видов спорта.\n\n` +
                    `Основные функции:\n` +
                    `• 📹 Загрузка и просмотр видео с трюками\n` +
                    `• 💰 Система баллов и наград\n` +
                    `• 🏆 Турниры и конкурсы\n` +
                    `• 🛍️ Маркет товаров\n` +
                    `• 👥 Социальные функции\n\n` +
                    `📞 Поддержка: @tricksby`;
          break;
      }

      // Отвечаем на callback query
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: 'Загружается...'
        }),
      });

      if (response) {
        await sendMessage(chatId, response, replyMarkup ? { reply_markup: replyMarkup } : {});
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
      
      // Подтверждаем платеж
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
