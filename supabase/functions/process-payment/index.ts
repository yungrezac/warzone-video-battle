
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
}

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_id, 
      telegram_payment_charge_id, 
      telegram_invoice_payload 
    }: ProcessPaymentRequest = await req.json();
    
    console.log('Обработка платежа:', {
      user_id,
      telegram_payment_charge_id,
      telegram_invoice_payload
    });

    // Инициализируем Supabase клиент
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Вызываем функцию создания подписки
    const { data, error } = await supabase.rpc('create_subscription_after_payment', {
      p_user_id: user_id,
      p_telegram_charge_id: telegram_payment_charge_id,
      p_invoice_payload: telegram_invoice_payload,
      p_amount_stars: 300
    });

    if (error) {
      console.error('Ошибка создания подписки:', error);
      throw error;
    }

    const result = data as { success: boolean; error?: string; subscription_id?: string; expires_at?: string };

    if (!result.success) {
      console.error('Платеж не может быть обработан:', result.error);
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Платеж обработан успешно:', {
      subscription_id: result.subscription_id,
      expires_at: result.expires_at
    });

    // Отправляем уведомление пользователю через бота
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (botToken) {
      try {
        const { data: user } = await supabase
          .from('profiles')
          .select('telegram_id, first_name')
          .eq('id', user_id)
          .single();

        if (user?.telegram_id) {
          const notificationMessage = `🎉 Поздравляем, ${user.first_name}!\n\nВаша Premium подписка активирована!\n\n✨ Теперь вам доступны все премиум функции:\n• Неограниченная загрузка видео\n• Приоритетное размещение\n• Эксклюзивные значки\n• И многое другое!\n\nПодписка действует до: ${new Date(result.expires_at!).toLocaleDateString('ru-RU')}`;

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
        subscription_id: result.subscription_id,
        expires_at: result.expires_at,
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
