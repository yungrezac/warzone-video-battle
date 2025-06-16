
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessPaymentRequest {
  user_id: string;
  telegram_payment_charge_id: string;
  telegram_invoice_payload: string;
  subscription_expiration_date?: string;
  is_recurring?: boolean;
  is_first_recurring?: boolean;
}

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_id, 
      telegram_payment_charge_id, 
      telegram_invoice_payload,
      subscription_expiration_date,
      is_recurring = false,
      is_first_recurring = false
    }: ProcessPaymentRequest = await req.json();
    
    console.log('Обработка платежа (с поддержкой подписок):', {
      user_id,
      telegram_payment_charge_id,
      telegram_invoice_payload,
      subscription_expiration_date,
      is_recurring,
      is_first_recurring
    });

    // Инициализируем Supabase клиент
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Проверяем, не обработан ли уже этот платеж
    const { data: existingPayment, error: checkError } = await supabase
      .from('payments')
      .select('id')
      .eq('telegram_payment_charge_id', telegram_payment_charge_id)
      .maybeSingle();

    if (checkError) {
      console.error('Ошибка проверки существующего платежа:', checkError);
      throw checkError;
    }

    if (existingPayment) {
      console.log('Платеж уже обработан:', telegram_payment_charge_id);
      return new Response(
        JSON.stringify({ error: 'Payment already processed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Определяем дату окончания подписки
    let expiresAt: Date;
    if (subscription_expiration_date) {
      // Используем дату из Telegram API
      expiresAt = new Date(subscription_expiration_date);
    } else {
      // Fallback: добавляем 30 дней от текущей даты
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    // Создаем или обновляем подписку
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user_id,
        subscription_type: 'premium',
        status: 'active',
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        telegram_payment_charge_id: telegram_payment_charge_id,
        telegram_invoice_payload: telegram_invoice_payload,
        amount_stars: 1, // Обновлено на 1 Star
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,status', // Обновляем если уже есть активная подписка
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Ошибка создания/обновления подписки:', subscriptionError);
      throw subscriptionError;
    }

    // Записываем платеж
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user_id,
        subscription_id: subscription.id,
        telegram_payment_charge_id: telegram_payment_charge_id,
        telegram_invoice_payload: telegram_invoice_payload,
        amount_stars: 1, // Обновлено на 1 Star
        status: 'succeeded',
        processed_at: new Date().toISOString()
      });

    if (paymentError) {
      console.error('Ошибка записи платежа:', paymentError);
      throw paymentError;
    }

    // Обновляем профиль пользователя
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_expires_at: expiresAt.toISOString()
      })
      .eq('id', user_id);

    if (profileError) {
      console.error('Ошибка обновления профиля:', profileError);
      throw profileError;
    }

    console.log('Подписка обработана успешно:', {
      subscription_id: subscription.id,
      expires_at: expiresAt.toISOString(),
      is_recurring: is_recurring,
      is_first_recurring: is_first_recurring
    });

    // Отправляем уведомление пользователю
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (botToken) {
      try {
        const { data: user } = await supabase
          .from('profiles')
          .select('telegram_id, first_name')
          .eq('id', user_id)
          .single();

        if (user?.telegram_id) {
          const notificationMessage = is_first_recurring 
            ? `🎉 Поздравляем, ${user.first_name}!\n\nВаша подписка TRICKS PREMIUM активирована с автоматическим продлением!\n\n✨ Теперь вам доступны все эксклюзивные функции.\n\nПодписка действует до: ${expiresAt.toLocaleDateString('ru-RU')}\n\n🔄 Подписка будет автоматически продлеваться каждый месяц.`
            : `✅ Подписка TRICKS PREMIUM продлена!\n\nДействует до: ${expiresAt.toLocaleDateString('ru-RU')}\n\nСпасибо за поддержку!`;

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.telegram_id,
              text: notificationMessage,
              parse_mode: 'HTML'
            }),
          });
        }
      } catch (notificationError) {
        console.error('Ошибка отправки уведомления:', notificationError);
        // Не прерываем выполнение из-за ошибки уведомления
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        expires_at: expiresAt.toISOString(),
        is_recurring: is_recurring,
        is_first_recurring: is_first_recurring,
        message: 'Payment processed successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Ошибка в process-payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(serve_handler);
