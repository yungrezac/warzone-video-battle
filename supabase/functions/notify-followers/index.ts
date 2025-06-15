
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { videoId } = await req.json()
    if (!videoId) {
      throw new Error('videoId is required')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Получаем информацию о видео и авторе
    const { data: videoData, error: videoError } = await supabaseAdmin
      .from('videos')
      .select('title, user_id, profiles(username, first_name, telegram_username)')
      .eq('id', videoId)
      .single()

    if (videoError) throw videoError
    if (!videoData) throw new Error('Video not found')

    const author = videoData.profiles
    const authorName = author?.username || author?.first_name || author?.telegram_username || 'Пользователь'
    const { title: videoTitle, user_id: authorId } = videoData

    // 2. Получаем подписчиков, которые хотят получать уведомления
    const { data: followersData, error: followersError } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        profile:subscriber_id (
          id,
          telegram_id,
          notification_settings ( new_video_notifications )
        )
      `)
      .eq('subscribed_to_id', authorId)

    if (followersError) throw followersError

    const followersToNotify = followersData
      .map(f => f.profile)
      .filter(p => {
        if (!p || !p.telegram_id) return false
        const setting = p.notification_settings?.[0]
        // Уведомляем, если настроек нет (по умолчанию включено) или они явно включены
        return !setting || setting.new_video_notifications === true
      })

    if (followersToNotify.length === 0) {
      console.log('Нет подписчиков для уведомления.')
      return new Response(JSON.stringify({ success: true, message: 'No followers to notify.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Отправляем уведомления
    const message = `🎬 <b>${authorName}</b> опубликовал(а) новое видео: "<b>${videoTitle}</b>"`
    
    const notificationPromises = followersToNotify.map(follower => {
      if(follower?.telegram_id) {
          return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  chat_id: follower.telegram_id,
                  text: message,
                  parse_mode: 'HTML',
              }),
          }).then(res => res.json())
      }
      return Promise.resolve();
    })

    await Promise.all(notificationPromises)

    console.log(`Отправлено ${followersToNotify.length} уведомлений о новом видео.`)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Ошибка в функции notify-followers:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

serve(handler)
