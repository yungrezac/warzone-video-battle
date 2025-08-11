
import { useCallback } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';

export const useTelegramShare = () => {
  const { webApp, isTelegramWebApp, hapticFeedback } = useTelegramWebApp();

  const shareVideo = useCallback((videoUrl: string, title: string, description?: string) => {
    if (!isTelegramWebApp || !webApp) {
      // Fallback для веб-версии
      if (navigator.share) {
        navigator.share({
          title: `TRICKS: ${title}`,
          text: description || 'Посмотри этот крутой трюк!',
          url: videoUrl,
        });
      } else {
        navigator.clipboard.writeText(videoUrl);
      }
      return;
    }

    hapticFeedback('selection');
    
    const shareText = `🎬 ${title}\n\n${description || 'Посмотри этот крутой трюк в TRICKS!'}\n\n${videoUrl}`;
    
    webApp.switchInlineQuery(shareText, ['users', 'groups']);
  }, [webApp, isTelegramWebApp, hapticFeedback]);

  const shareToStory = useCallback((mediaUrl: string, text?: string, widgetUrl?: string) => {
    if (!isTelegramWebApp || !webApp?.shareToStory) {
      console.warn('Story sharing не поддерживается');
      return;
    }

    hapticFeedback('impact');
    
    webApp.shareToStory(mediaUrl, {
      text: text || 'Смотри мои трюки в TRICKS!',
      widget_link: widgetUrl ? {
        url: widgetUrl,
        name: 'TRICKS'
      } : undefined
    });
  }, [webApp, isTelegramWebApp, hapticFeedback]);

  const shareProfile = useCallback((username: string, userId: string) => {
    const profileUrl = `${window.location.origin}?start_param=profile_${userId}`;
    const shareText = `👤 Профиль ${username} в TRICKS\n\nПосмотри его крутые трюки!\n\n${profileUrl}`;
    
    if (isTelegramWebApp && webApp) {
      hapticFeedback('selection');
      webApp.switchInlineQuery(shareText);
    } else {
      navigator.clipboard.writeText(profileUrl);
    }
  }, [webApp, isTelegramWebApp, hapticFeedback]);

  return {
    shareVideo,
    shareToStory,
    shareProfile,
    isAvailable: isTelegramWebApp && !!webApp,
  };
};
