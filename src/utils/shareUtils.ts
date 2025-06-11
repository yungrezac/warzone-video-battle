export const captureElementAsImage = async (element: HTMLElement): Promise<Blob> => {
  const html2canvas = (await import('html2canvas')).default;
  
  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    scale: 2, // Высокое качество
    width: element.offsetWidth,
    height: element.offsetHeight,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png', 0.9);
  });
};

export const shareToTelegram = async (imageBlob: Blob, text: string) => {
  try {
    // Проверяем доступность Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Конвертируем изображение в base64
      const imageBase64 = await blobToBase64(imageBlob);
      
      // Используем haptic feedback
      if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
      }
      
      // Получаем данные пользователя из Telegram WebApp
      const user = tg.initDataUnsafe?.user;
      if (!user) {
        throw new Error('Не удалось получить данные пользователя');
      }
      
      // Отправляем данные на нашу Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/telegram-share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramUserId: user.id,
          image: imageBase64,
          text: text,
          initData: tg.initData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Ошибка отправки: ${errorData.error || 'Unknown error'}`);
      }
      
      // Показываем уведомление об успешной отправке
      if (tg.showAlert) {
        tg.showAlert('Сообщение создано в Telegram! Теперь вы можете переслать его любому пользователю.');
      } else {
        alert('Сообщение создано в Telegram! Теперь вы можете переслать его любому пользователю.');
      }
      
      return true;
    } else {
      // Веб-версия - используем Web Share API или fallback
      if (navigator.share) {
        const file = new File([imageBlob], 'trick_share.png', { type: 'image/png' });
        await navigator.share({
          title: 'TRICKS',
          text: text,
          files: [file]
        });
        return true;
      } else {
        // Fallback - скачиваем изображение и копируем текст
        downloadImage(imageBlob, 'trick_share.png');
        await navigator.clipboard.writeText(text);
        alert('Изображение скачано, текст скопирован в буфер обмена!');
        return true;
      }
    }
  } catch (error) {
    console.error('Ошибка при попытке поделиться:', error);
    
    // Fallback - скачиваем изображение
    try {
      downloadImage(imageBlob, 'trick_share.png');
      await navigator.clipboard.writeText(text);
      alert('Изображение скачано, текст скопирован в буфер обмена!');
      return true;
    } catch (fallbackError) {
      console.error('Ошибка fallback:', fallbackError);
      return false;
    }
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const downloadImage = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateShareText = (
  isOwnVideo: boolean, 
  videoOwnerName: string,
  appUrl: string = 'https://t.me/TricksVideosBot/start'
): string => {
  if (isOwnVideo) {
    return `🎯 Посмотри на мой трюк в TRICKS!\n\n${appUrl}`;
  } else {
    return `🎯 Посмотри трюк ${videoOwnerName} в приложении TRICKS!\n\n${appUrl}`;
  }
};
