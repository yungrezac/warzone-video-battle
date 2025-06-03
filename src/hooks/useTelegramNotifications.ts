
import { supabase } from '@/integrations/supabase/client';

export const useTelegramNotifications = () => {
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

  const sendLikeNotification = async (videoOwnerTelegramId: string, likerName: string, videoTitle: string) => {
    const message = `❤️ <b>${likerName}</b> поставил лайк вашему видео "<b>${videoTitle}</b>"!`;
    return sendNotification(videoOwnerTelegramId, message, 'like');
  };

  const sendCommentNotification = async (videoOwnerTelegramId: string, commenterName: string, videoTitle: string, comment: string) => {
    const shortComment = comment.length > 50 ? comment.substring(0, 50) + '...' : comment;
    const message = `💬 <b>${commenterName}</b> оставил комментарий к вашему видео "<b>${videoTitle}</b>":\n\n"${shortComment}"`;
    return sendNotification(videoOwnerTelegramId, message, 'comment');
  };

  const sendAchievementNotification = async (userTelegramId: string, achievementTitle: string, achievementIcon: string, rewardPoints: number) => {
    const message = `🏆 <b>Поздравляем!</b>\n\nВы получили достижение:\n${achievementIcon} <b>${achievementTitle}</b>\n\n+${rewardPoints} баллов!`;
    return sendNotification(userTelegramId, message, 'achievement');
  };

  const sendDailyWinnerNotification = async (winnerTelegramId: string, videoTitle: string, totalPoints: number) => {
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
