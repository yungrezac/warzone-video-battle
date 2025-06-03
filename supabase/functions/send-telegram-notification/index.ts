
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramNotificationRequest {
  telegramId: string;
  message: string;
  type: 'like' | 'comment' | 'achievement' | 'daily_winner';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing Telegram notification request...');
    
    const { telegramId, message, type }: TelegramNotificationRequest = await req.json();
    
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    if (!telegramId || !message) {
      throw new Error('telegramId and message are required');
    }

    console.log(`Sending ${type} notification to user ${telegramId}`);

    // Отправляем уведомление через Telegram Bot API
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const telegramData = await telegramResponse.json();
    
    if (!telegramResponse.ok) {
      console.error('Telegram API error:', telegramData);
      throw new Error(`Telegram API error: ${telegramData.description || 'Unknown error'}`);
    }

    console.log('Telegram notification sent successfully:', telegramData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        telegramResponse: telegramData 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-telegram-notification function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
