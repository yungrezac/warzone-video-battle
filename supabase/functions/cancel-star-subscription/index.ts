
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelSubscriptionRequest {
  user_id: string;
  subscription_id: string;
  telegram_user_id: string;
}

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, subscription_id, telegram_user_id }: CancelSubscriptionRequest = await req.json();
    
    console.log('Отмена звездной подписки:', {
      user_id,
      subscription_id,
      telegram_user_id
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    // Отменяем подписку через Telegram API
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/editUserStarSubscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: parseInt(telegram_user_id),
        telegram_payment_charge_id: subscription_id, // ID транзакции подписки
        is_canceled: true
      }),
    });

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      console.error('Ошибка отмены подписки в Telegram:', telegramResult);
      throw new Error(`Failed to cancel Telegram subscription: ${telegramResult.description}`);
    }

    // Обновляем статус подписки в нашей базе данных
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription_id)
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Ошибка обновления статуса подписки:', updateError);
      throw updateError;
    }

    // Обновляем профиль пользователя
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_premium: false,
        premium_expires_at: null
      })
      .eq('id', user_id);

    if (profileError) {
      console.error('Ошибка обновления профиля:', profileError);
      throw profileError;
    }

    console.log('Подписка успешно отменена');

    // Отправляем уведомление пользователю
    try {
      const { data: user } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user_id)
        .single();

      if (user) {
        const notificationMessage = `😔 ${user.first_name}, ваша подписка TRICKS PREMIUM была отменена.\n\nВы можете оформить новую подписку в любое время через приложение.\n\nСпасибо за то, что были с нами!`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegram_user_id,
            text: notificationMessage,
            parse_mode: 'HTML'
          }),
        });
      }
    } catch (notificationError) {
      console.error('Ошибка отправки уведомления:', notificationError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription cancelled successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Ошибка в cancel-star-subscription:', error);
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
