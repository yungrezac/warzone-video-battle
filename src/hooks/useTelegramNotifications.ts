
import { supabase } from '@/integrations/supabase/client';

export const useTelegramNotifications = () => {
  const checkNotificationSettings = async (userId: string, notificationType: 'likes' | 'comments' | 'achievements' | 'winners' | 'system') => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Ошибка проверки настроек уведомлений:', error);
        return true; // По умолчанию разрешаем отправку
      }

      if (!data) {
        return true; // Если настроек нет, разрешаем отправку
      }

      switch (notificationType) {
        case 'likes':
          return data.likes_notifications;
        case 'comments':
          return data.comments_notifications;
        case 'achievements':
          return data.achievements_notifications;
        case 'winners':
          return data.winners_notifications;
        case 'system':
          return data.system_notifications;
        default:
          return true;
      }
    } catch (error) {
      console.error('Ошибка проверки настроек уведомлений:', error);
      return true; // По умолчанию разрешаем отправку
    }
  };

  const sendNotification = async (
    telegramId: string, 
    message: string, 
    type: 'like' | 'comment' | 'achievement' | 'daily_winner'
  ) => {
    try {
      console.log(`Отправляем Telegram уведомление пользователю ${telegramId}:`, message);
      
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: {
          telegramId,
          message,
          type,
        },
      });

      if (error) {
        console.error('Ошибка отправки Telegram уведомления:', error);
        throw error;
      }

      console.log('Telegram уведомление отправлено успешно:', data);
      return data;
    } catch (error) {
      console.error('Ошибка отправки Telegram уведомления:', error);
      throw error;
    }
  };

  const sendLikeNotification = async (videoOwnerId: string, videoOwnerTelegramId: string, likerName: string, videoTitle: string) => {
    const isEnabled = await checkNotificationSettings(videoOwnerId, 'likes');
    if (!isEnabled) {
      console.log('Уведомления о лайках отключены для пользователя', videoOwnerId);
      return;
    }

    const message = `❤️ <b>${likerName}</b> поставил лайк вашему видео "<b>${videoTitle}</b>"!`;
    return sendNotification(videoOwnerTelegramId, message, 'like');
  };

  const sendCommentNotification = async (videoOwnerId: string, videoOwnerTelegramId: string, commenterName: string, videoTitle: string, comment: string) => {
    const isEnabled = await checkNotificationSettings(videoOwnerId, 'comments');
    if (!isEnabled) {
      console.log('Уведомления о комментариях отключены для пользователя', videoOwnerId);
      return;
    }

    const shortComment = comment.length > 50 ? comment.substring(0, 50) + '...' : comment;
    const message = `💬 <b>${commenterName}</b> оставил комментарий к вашему видео "<b>${videoTitle}</b>":\n\n"${shortComment}"`;
    return sendNotification(videoOwnerTelegramId, message, 'comment');
  };

  const sendAchievementNotification = async (userId: string, userTelegramId: string, achievementTitle: string, achievementIcon: string, rewardPoints: number) => {
    const isEnabled = await checkNotificationSettings(userId, 'achievements');
    if (!isEnabled) {
      console.log('Уведомления о достижениях отключены для пользователя', userId);
      return;
    }

    const message = `🏆 <b>Поздравляем!</b>\n\nВы получили достижение:\n${achievementIcon} <b>${achievementTitle}</b>\n\n+${rewardPoints} баллов!`;
    return sendNotification(userTelegramId, message, 'achievement');
  };

  const sendDailyWinnerNotification = async (winnerId: string, winnerTelegramId: string, videoTitle: string, totalPoints: number) => {
    const isEnabled = await checkNotificationSettings(winnerId, 'winners');
    if (!isEnabled) {
      console.log('Уведомления о победах отключены для пользователя', winnerId);
      return;
    }

    const message = `🎉 <b>Поздравляем!</b>\n\nВаше видео "<b>${videoTitle}</b>" победило в ежедневном конкурсе!\n\nВы получили <b>${totalPoints} баллов</b>!`;
    return sendNotification(winnerTelegramId, message, 'daily_winner');
  };

  return {
    sendLikeNotification,
    sendCommentNotification,
    sendAchievementNotification,
    sendDailyWinnerNotification,
  };
};
