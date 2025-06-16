
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateInvoiceRequest {
  user_id: string;
  subscription_period?: number; // В секундах (30 дней = 2592000)
}

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, subscription_period = 2592000 }: CreateInvoiceRequest = await req.json(); // 30 дней по умолчанию
    
    console.log('Создание рекуррентного счета для пользователя:', user_id);

    // Инициализируем Supabase клиент
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Проверяем пользователя
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      console.error('Пользователь не найден:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Создаем уникальный payload для счета
    const invoicePayload = `premium_subscription_${user_id}_${Date.now()}`;
    
    // Данные для создания рекуррентного инвойса через Telegram Bot API
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    // Создаем инвойсную ссылку с поддержкой подписок
    const invoiceData = {
      title: 'TRICKS PREMIUM',
      description: 'Подписка на премиум функции TRICKS с автоматическим продлением каждый месяц.',
      payload: invoicePayload,
      provider_token: '', // Для Telegram Stars оставляем пустым
      currency: 'XTR', // Telegram Stars
      prices: [
        {
          label: 'TRICKS PREMIUM (месячная подписка)',
          amount: 300 // 300 Telegram Stars
        }
      ],
      photo_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      photo_width: 400,
      photo_height: 300,
      need_name: false,
      need_phone_number: false,
      need_email: false,
      need_shipping_address: false,
      send_phone_number_to_provider: false,
      send_email_to_provider: false,
      is_flexible: false,
      start_parameter: 'premium_subscription',
      subscription_period: subscription_period // Новый параметр для рекуррентных подписок
    };

    console.log('Создаем рекуррентный инвойс:', invoiceData);

    // Создаем инвойсную ссылку через createInvoiceLink с поддержкой подписок
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      console.error('Ошибка создания рекуррентного инвойса в Telegram:', telegramResult);
      throw new Error(`Failed to create Telegram recurring invoice: ${telegramResult.description}`);
    }

    const invoiceUrl = telegramResult.result;

    console.log('Рекуррентный инвойс создан успешно:', {
      payload: invoicePayload,
      telegram_id: user.telegram_id,
      invoice_url: invoiceUrl,
      subscription_period: subscription_period
    });

    return new Response(
      JSON.stringify({
        success: true,
        invoice_payload: invoicePayload,
        invoice_url: invoiceUrl,
        subscription_period: subscription_period,
        is_recurring: true,
        message: 'Recurring subscription invoice created successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Ошибка в create-subscription-invoice:', error);
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
