
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const WEBAPP_URL = 'https://cibytresc-wntdgxqjpfm.lovableproject.com'; // URL вашего мини-приложения

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  message?: {
    chat: {
      id: number;
    };
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    text: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Получен запрос от Telegram бота');
    
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN не настроен');
    }

    const update: TelegramUpdate = await req.json();
    console.log('Telegram update:', update);

    if (!update.message) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { chat, from, text } = update.message;
    
    // Обрабатываем команду /start
    if (text === '/start') {
      await sendWelcomeMessage(chat.id, from.first_name);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Ошибка в telegram-bot функции:', error);
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

async function sendWelcomeMessage(chatId: number, firstName: string) {
  const welcomeText = `🛼 Привет, ${firstName}!

Добро пожаловать в <b>WZ Battle</b> — самое крутое приложение для роллеров!

🔥 <b>Что тебя ждет:</b>
• Загружай видео своих трюков
• Участвуй в ежедневных соревнованиях  
• Получай лайки и оценки от сообщества
• Зарабатывай баллы за победы
• Открывай достижения
• Покупай крутые предметы в магазине

🏆 <b>Как это работает:</b>
Каждый день проходит голосование за лучший трюк. Побеждает видео с наибольшим количеством оценок! Победитель получает баллы равные количеству голосов.

Готов показать свои навыки? Жми кнопку ниже! 👇`;

  const keyboard = {
    inline_keyboard: [
      [{
        text: "🚀 Открыть WZ Battle",
        web_app: {
          url: WEBAPP_URL
        }
      }]
    ]
  };

  console.log(`Отправляем приветственное сообщение пользователю ${chatId}`);

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    }),
  });

  const telegramData = await response.json();
  
  if (!response.ok) {
    console.error('Ошибка отправки сообщения Telegram:', telegramData);
    throw new Error(`Telegram API error: ${telegramData.description || 'Unknown error'}`);
  }

  console.log('Приветственное сообщение отправлено успешно:', telegramData);
}

serve(handler);
