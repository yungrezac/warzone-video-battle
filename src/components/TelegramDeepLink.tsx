
import React, { useEffect, useState } from 'react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useAuth } from './AuthWrapper';
import { supabase } from '@/integrations/supabase/client';

interface DeepLinkHandler {
  type: 'profile' | 'video' | 'tournament' | 'battle';
  id: string;
}

const TelegramDeepLink: React.FC = () => {
  const { initData, isTelegramWebApp } = useTelegramWebApp();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const parseStartParam = (startParam: string): DeepLinkHandler | null => {
    if (!startParam) return null;

    // Формат: type_id (например: profile_123, video_456, tournament_789)
    const [type, id] = startParam.split('_');
    
    if (!type || !id) return null;

    const validTypes = ['profile', 'video', 'tournament', 'battle'];
    if (!validTypes.includes(type)) return null;

    return { type: type as DeepLinkHandler['type'], id };
  };

  const handleDeepLink = async (handler: DeepLinkHandler) => {
    if (!user || isProcessing) return;

    setIsProcessing(true);

    try {
      switch (handler.type) {
        case 'profile':
          await handleProfileDeepLink(handler.id);
          break;
        case 'video':
          await handleVideoDeepLink(handler.id);
          break;
        case 'tournament':
          await handleTournamentDeepLink(handler.id);
          break;
        case 'battle':
          await handleBattleDeepLink(handler.id);
          break;
      }
    } catch (error) {
      console.error('Ошибка обработки deep link:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProfileDeepLink = async (profileId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profile) {
        console.log('🔗 Открываем профиль через deep link:', profile.username);
        // Здесь можно добавить логику открытия профиля
        // Например, через роутер или модальное окно
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }
  };

  const handleVideoDeepLink = async (videoId: string) => {
    try {
      const { data: video } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (video) {
        console.log('🔗 Открываем видео через deep link:', video.title);
        // Логика открытия видео
      }
    } catch (error) {
      console.error('Ошибка загрузки видео:', error);
    }
  };

  const handleTournamentDeepLink = async (tournamentId: string) => {
    try {
      const { data: tournament } = await supabase
        .from('online_tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournament) {
        console.log('🔗 Открываем турнир через deep link:', tournament.title);
        // Логика открытия турнира
      }
    } catch (error) {
      console.error('Ошибка загрузки турнира:', error);
    }
  };

  const handleBattleDeepLink = async (battleId: string) => {
    try {
      const { data: battle } = await supabase
        .from('video_battles')
        .select('*')
        .eq('id', battleId)
        .single();

      if (battle) {
        console.log('🔗 Открываем битву через deep link:', battle.title);
        // Логика открытия битвы
      }
    } catch (error) {
      console.error('Ошибка загрузки битвы:', error);
    }
  };

  const generateShareLink = (type: string, id: string) => {
    const botUsername = 'tricksappbot'; // Замените на реальный username бота
    const startParam = `${type}_${id}`;
    return `https://t.me/${botUsername}?start=${startParam}`;
  };

  useEffect(() => {
    if (!isTelegramWebApp || !initData?.start_param || !user) return;

    const handler = parseStartParam(initData.start_param);
    if (handler) {
      console.log('🔗 Обрабатываем deep link:', handler);
      handleDeepLink(handler);
    }
  }, [isTelegramWebApp, initData, user]);

  // Этот компонент не рендерит UI, только обрабатывает deep links
  return null;
};

export default TelegramDeepLink;

// Экспортируем утилиты для создания deep links
export const createDeepLink = {
  profile: (profileId: string) => {
    const botUsername = 'tricksappbot'; // Замените на реальный
    return `https://t.me/${botUsername}?start=profile_${profileId}`;
  },
  
  video: (videoId: string) => {
    const botUsername = 'tricksappbot';
    return `https://t.me/${botUsername}?start=video_${videoId}`;
  },
  
  tournament: (tournamentId: string) => {
    const botUsername = 'tricksappbot';
    return `https://t.me/${botUsername}?start=tournament_${tournamentId}`;
  },
  
  battle: (battleId: string) => {
    const botUsername = 'tricksappbot';
    return `https://t.me/${botUsername}?start=battle_${battleId}`;
  },
};
