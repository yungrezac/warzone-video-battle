
import { supabase } from '@/integrations/supabase/client';
import { formatPoints } from '@/lib/utils';

export const useTelegramNotifications = () => {
  const checkNotificationSettings = async (userId: string, notificationType: 'likes' | 'comments' | 'achievements' | 'winners' | 'system' | 'new_video' | 'new_subscriber') => {
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
        case 'new_video':
          return data.new_video_notifications;
        case 'new_subscriber':
          return data.new_subscriber_notifications;
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
    type: 'like' | 'comment' | 'achievement' | 'daily_winner' | 'comment_like' | 'comment_reply' | 'new_video' | 'new_subscriber'
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

  const sendCommentLikeNotification = async (
    commentOwnerId: string, 
    commentOwnerTelegramId: string, 
    likerName: string, 
    commentContent: string
  ) => {
    const isEnabled = await checkNotificationSettings(commentOwnerId, 'likes');
    if (!isEnabled) {
      console.log('Уведомления о лайках (комментариев) отключены для пользователя', commentOwnerId);
      return;
    }

    const shortComment = commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent;
    const message = `👍 <b>${likerName}</b> оценил(а) ваш комментарий:\n\n"<i>${shortComment}</i>"`;
    return sendNotification(commentOwnerTelegramId, message, 'comment_like');
  };

  const sendCommentReplyNotification = async (
    parentCommentOwnerId: string, 
    parentCommentOwnerTelegramId: string, 
    replierName: string, 
    replyContent: string,
    videoTitle: string
  ) => {
    const isEnabled = await checkNotificationSettings(parentCommentOwnerId, 'comments');
    if (!isEnabled) {
      console.log('Уведомления об ответах на комментарии отключены для пользователя', parentCommentOwnerId);
      return;
    }

    const shortReply = replyContent.length > 50 ? replyContent.substring(0, 50) + '...' : replyContent;
    const message = `💬 <b>${replierName}</b> ответил(а) на ваш комментарий к видео "<b>${videoTitle}</b>":\n\n"<i>${shortReply}</i>"`;
    return sendNotification(parentCommentOwnerTelegramId, message, 'comment_reply');
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

  const sendNewVideoNotification = async (followerId: string, followerTelegramId: string, authorName: string, videoTitle: string) => {
    const isEnabled = await checkNotificationSettings(followerId, 'new_video');
    if (!isEnabled) {
      console.log('Уведомления о новых видео отключены для пользователя', followerId);
      return;
    }
    const message = `🎬 <b>${authorName}</b> опубликовал(а) новое видео: "<b>${videoTitle}</b>"`;
    return sendNotification(followerTelegramId, message, 'new_video');
  };

  const sendNewSubscriberNotification = async (subscribedToUserId: string, subscribedToUserTelegramId: string, subscriberName: string) => {
    const isEnabled = await checkNotificationSettings(subscribedToUserId, 'new_subscriber');
    if (!isEnabled) {
      console.log('Уведомления о новых подписчиках отключены для пользователя', subscribedToUserId);
      return;
    }
    const message = `👋 На вас подписался новый пользователь: <b>${subscriberName}</b>`;
    return sendNotification(subscribedToUserTelegramId, message, 'new_subscriber');
  };

  const sendDailyWinnerNotification = async (winnerId: string, winnerTelegramId: string, videoTitle: string, totalPoints: number) => {
    const isEnabled = await checkNotificationSettings(winnerId, 'winners');
    if (!isEnabled) {
      console.log('Уведомления о победах отключены для пользователя', winnerId);
      return;
    }
    const message = `🏆 Поздравляем! Вы стали <b>победителем дня</b> с видео "<b>${videoTitle}</b>" и заработали <b>${formatPoints(totalPoints)}</b> <i class="font-bold balance-icon">Б</i>!`;
    return sendNotification(winnerTelegramId, message, 'daily_winner');
  };

  return {
    sendLikeNotification,
    sendCommentNotification,
    sendAchievementNotification,
    sendDailyWinnerNotification,
    sendCommentLikeNotification,
    sendCommentReplyNotification,
    sendNewVideoNotification,
    sendNewSubscriberNotification,
  };
};
