
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telegramUserId, image, text, initData } = await req.json();
    
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not set');
    }
    
    console.log('Обработка запроса на шеринг для пользователя:', telegramUserId);
    
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
      JSON.stringify({ 
        success: true, 
        message: 'Изображение отправлено',
        messageId: result.result.message_id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('Ошибка в telegram-share:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
