import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sword, 
  Users, 
  Calendar, 
  Star, 
  ChevronDown, 
  ChevronUp,
  Timer,
  Crown,
  Clock,
  Play
} from 'lucide-react';
import { useAuth } from '@/components/AuthWrapper';
import { useJoinBattle, useBattleParticipants, useStartBattle } from '@/hooks/useVideoBattles';
import VideoPlayer from './VideoPlayer';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { supabase } from '@/integrations/supabase/client';
import BattleManagement from './BattleManagement';

interface VideoBattleCardProps {
  battle: {
    id: string;
    title: string;
    description: string;
    reference_video_url: string;
    reference_video_title: string;
    start_time: string;
    time_limit_minutes: number;
    status: 'registration' | 'active' | 'completed' | 'cancelled';
    current_participant_id?: string;
    current_deadline?: string;
    current_video_sequence?: number;
    winner_id?: string;
    prize_points: number;
    organizer_id: string;
    winner?: {
      username?: string;
      first_name?: string;
      avatar_url?: string;
    };
  };
}

const VideoBattleCard: React.FC<VideoBattleCardProps> = ({ battle }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [countdown, setCountdown] = useState('');
  const { user } = useAuth();
  const joinBattleMutation = useJoinBattle();
  const startBattleMutation = useStartBattle();
  const { data: participants, refetch: refetchParticipants } = useBattleParticipants(battle.id);

  const activeParticipants = participants?.filter(p => p.status === 'active') || [];
  const participantCount = activeParticipants.length;
  const isUserParticipant = activeParticipants.some(p => p.user_id === user?.id);
  const canJoin = battle.status === 'registration' && !isUserParticipant;
  const isOrganizer = battle.organizer_id === user?.id;

  const [isJudge, setIsJudge] = React.useState(false);
  
  React.useEffect(() => {
    const checkJudgeStatus = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('battle_judges')
        .select('id')
        .eq('battle_id', battle.id)
        .eq('judge_id', user.id)
        .maybeSingle();
        
      setIsJudge(!!data);
    };
    
    checkJudgeStatus();
  }, [battle.id, user?.id]);

  useEffect(() => {
    const channel = supabase
      .channel('battle-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_participants',
          filter: `battle_id=eq.${battle.id}`
        },
        () => {
          refetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battle.id, refetchParticipants]);

  useEffect(() => {
    if (battle.status !== 'registration') return;

    const updateCountdown = () => {
      const startTime = new Date(battle.start_time);
      const now = new Date();
      const diff = startTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Батл начался!');
        (async () => {
          try {
            await supabase.rpc('auto_start_battles');
          } catch (error) {
            console.error(error);
          }
        })();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}д ${hours}ч ${minutes}м`);
      } else if (hours > 0) {
        setCountdown(`${hours}ч ${minutes}м ${seconds}с`);
      } else {
        setCountdown(`${minutes}м ${seconds}с`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [battle.start_time, battle.status]);

  const handleJoinBattle = async () => {
    if (!user) return;
    joinBattleMutation.mutate({
      battleId: battle.id,
      userId: user.id,
    });
  };

  const handleStartBattle = async () => {
    startBattleMutation.mutate(battle.id);
  };

  const getStatusBadge = () => {
    switch (battle.status) {
      case 'registration':
        return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">Регистрация</Badge>;
      case 'active':
        return <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">Активный</Badge>;
      case 'completed':
        return <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0">Завершен</Badge>;
      case 'cancelled':
        return <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">Отменен</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const utcDate = new Date(dateString);
    const moscowDate = new Date(utcDate.getTime() + (3 * 60 * 60 * 1000));
    
    return moscowDate.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow'
    });
  };

  if (battle.status === 'completed' && battle.winner_id && battle.winner) {
    return (
      <Card className="overflow-hidden bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="relative">
              <Crown className="w-16 h-16 mx-auto text-yellow-500 drop-shadow-lg" />
              <div className="absolute inset-0 w-16 h-16 mx-auto bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-800">БАТЛ ЗАВЕРШЕН</h3>
              <h4 className="text-lg font-semibold text-gray-700">{battle.title}</h4>
            </div>
            <div className="flex items-center justify-center gap-4 bg-white/80 rounded-xl p-4">
              <img
                src={battle.winner.avatar_url || '/placeholder-avatar.png'}
                alt="Winner"
                className="w-14 h-14 rounded-full border-3 border-yellow-400 shadow-md"
              />
              <div className="text-left">
                <p className="font-bold text-gray-800 text-lg">
                  {battle.winner.first_name || battle.winner.username}
                </p>
                <p className="text-sm text-gray-600">
                  Участников: {participantCount}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {battle.status === 'active' && (
        <BattleManagement 
          battle={{
            ...battle,
            current_video_sequence: battle.current_video_sequence || 1
          }}
          isJudge={isJudge}
          isOrganizer={isOrganizer}
        />
      )}
      
      <Card className="overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
        <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Sword className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-xl font-bold text-gray-800">{battle.title}</span>
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <h4 className="font-semibold mb-3 text-gray-700">Эталонное видео</h4>
            <div className="relative inline-block rounded-2xl overflow-hidden shadow-lg bg-black">
              <AspectRatio ratio={9 / 16} className="w-48">
                <VideoPlayer
                  src={battle.reference_video_url}
                  thumbnail="/placeholder.svg"
                  title={battle.reference_video_title}
                  className="w-full h-full"
                  videoId={`battle-ref-${battle.id}`}
                />
              </AspectRatio>
              <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                <Play className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2 font-medium">{battle.reference_video_title}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Участники</p>
                <p className="font-bold text-blue-700">{participantCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-50 rounded-lg p-3">
              <Timer className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Время</p>
                <p className="font-bold text-green-700">{battle.time_limit_minutes} мин</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-yellow-50 rounded-lg p-3">
              <Star className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Награда</p>
                <p className="font-bold text-yellow-700">{battle.prize_points}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Старт</p>
                <p className="font-bold text-purple-700 text-xs leading-tight">
                  {formatDate(battle.start_time).split(',')[0]}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className={`text-gray-700 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
              {battle.description}
            </p>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium"
            >
              {isExpanded ? (
                <>
                  Свернуть <ChevronUp className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Подробнее <ChevronDown className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {battle.status === 'active' && battle.current_participant_id && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium">
                <strong>Сейчас ход участника:</strong> {battle.current_participant_id}
              </p>
              {battle.current_deadline && (
                <p className="text-xs text-yellow-700 mt-1">
                  Дедлайн: {formatDate(battle.current_deadline)}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {canJoin && (
              <Button
                onClick={handleJoinBattle}
                disabled={joinBattleMutation.isPending}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
              >
                {joinBattleMutation.isPending ? 'Присоединение...' : 'Участвовать'}
              </Button>
            )}

            {isOrganizer && battle.status === 'registration' && participantCount >= 2 && (
              <Button
                onClick={handleStartBattle}
                disabled={startBattleMutation.isPending}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md"
              >
                {startBattleMutation.isPending ? 'Запуск...' : 'Запустить батл'}
              </Button>
            )}

            {battle.status === 'registration' && isUserParticipant && (
              <Button disabled className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white flex items-center gap-2 shadow-md">
                <Clock className="w-4 h-4" />
                {countdown || 'Ожидание старта'}
              </Button>
            )}

            {battle.status === 'active' && isUserParticipant && (
              <Button disabled className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md">
                Участвую в батле
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default VideoBattleCard;
