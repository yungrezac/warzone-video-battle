
export const captureElementAsImage = async (element: HTMLElement): Promise<Blob> => {
  // Импортируем html2canvas динамически
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
      
      // Создаем FormData для отправки изображения
      const formData = new FormData();
      formData.append('photo', imageBlob, 'trick_share.png');
      formData.append('caption', text);
      
      // Используем метод отправки данных в Telegram
      if (typeof tg.sendData === 'function') {
        const shareData = {
          type: 'share_image',
          image: await blobToBase64(imageBlob),
          text: text
        };
        
        tg.sendData(JSON.stringify(shareData));
        return true;
      }
      
      // Альтернативный способ через HapticFeedback и уведомление
      if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
      }
      
      // Показываем уведомление о том, что нужно поделиться вручную
      if (tg.showAlert) {
        tg.showAlert('Скопируйте текст и поделитесь изображением в чате Telegram!');
      }
      
      // Копируем текст в буфер обмена
      await navigator.clipboard.writeText(text);
      
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
