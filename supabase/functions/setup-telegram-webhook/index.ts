
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      return new Response(
        JSON.stringify({ 
          error: 'TELEGRAM_BOT_TOKEN не настроен в секретах Supabase',
          instructions: 'Добавьте токен бота в настройках Edge Functions' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // URL нашего webhook
    const webhookUrl = 'https://cibytrescwntdgxqjpfm.supabase.co/functions/v1/telegram-bot';
    
    console.log('🔧 Настраиваем webhook для Telegram бота...');
    console.log('📍 Webhook URL:', webhookUrl);

    // Настраиваем webhook
    const setWebhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: [
          'message',
          'callback_query',
          'pre_checkout_query',
          'successful_payment'
        ]
      }),
    });

    const setWebhookResult = await setWebhookResponse.json();

    if (!setWebhookResult.ok) {
      console.error('❌ Ошибка настройки webhook:', setWebhookResult);
      return new Response(
        JSON.stringify({ 
          error: 'Не удалось настроить webhook',
          telegram_error: setWebhookResult.description 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Проверяем статус webhook
    const getWebhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const webhookInfo = await getWebhookResponse.json();

    console.log('✅ Webhook настроен успешно:', webhookInfo.result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook настроен успешно!',
        webhook_url: webhookUrl,
        webhook_info: webhookInfo.result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Ошибка в setup-telegram-webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        instructions: 'Проверьте токен бота и попробуйте снова' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(serve_handler);
