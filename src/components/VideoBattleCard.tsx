
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sword, 
  Users, 
  Calendar, 
  Star, 
  Timer,
  Crown,
  Clock,
  Play,
  ChevronDown,
  ChevronUp
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

  // Realtime updates for participants
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

  // Countdown timer for registration battles
  useEffect(() => {
    if (battle.status !== 'registration') return;

    const updateCountdown = () => {
      const startTime = new Date(battle.start_time);
      const now = new Date();
      const diff = startTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Батл начался!');
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
        return <Badge className="bg-blue-500 text-white text-xs px-2 py-1">Регистрация</Badge>;
      case 'active':
        return <Badge className="bg-green-500 text-white text-xs px-2 py-1">Активный</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500 text-white text-xs px-2 py-1">Завершен</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white text-xs px-2 py-1">Отменен</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Компактный вид для завершенных батлов
  if (battle.status === 'completed') {
    return (
      <Card className="bg-gray-50 border-gray-200 shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-700 truncate">
                {battle.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">Завершен</span>
                {battle.winner && (
                  <span className="text-xs text-gray-600">
                    • Победитель: {battle.winner.first_name || battle.winner.username}
                  </span>
                )}
                <span className="text-xs text-gray-500">• {participantCount} участников</span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
              {battle.prize_points} баллов
            </Badge>
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
      
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Sword className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold truncate">{battle.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge()}
                  <span className="text-xs text-gray-500">
                    {formatDate(battle.start_time)}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex gap-4">
            {/* Video Preview */}
            <div className="flex-shrink-0">
              <div className="relative rounded-lg overflow-hidden bg-black w-20">
                <AspectRatio ratio={9 / 16}>
                  <VideoPlayer
                    src={battle.reference_video_url}
                    thumbnail="/placeholder.svg"
                    title={battle.reference_video_title}
                    className="w-full h-full object-cover"
                    videoId={`battle-${battle.id}`}
                  />
                </AspectRatio>
                <div className="absolute top-1 right-1 bg-black/60 rounded-full p-1">
                  <Play className="w-2 h-2 text-white" />
                </div>
              </div>
            </div>

            {/* Battle Info */}
            <div className="flex-1 space-y-3">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-sm font-medium">{participantCount}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5">
                  <Timer className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-sm font-medium">{battle.time_limit_minutes}м</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5">
                  <Star className="w-3.5 h-3.5 text-yellow-600" />
                  <span className="text-sm font-medium">{battle.prize_points}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs font-medium leading-tight">
                    {formatDate(battle.start_time).split(',')[0]}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {canJoin && (
                  <Button
                    onClick={handleJoinBattle}
                    disabled={joinBattleMutation.isPending}
                    size="sm"
                    className="flex-1 h-8 text-sm"
                  >
                    {joinBattleMutation.isPending ? 'Вход...' : 'Участвовать'}
                  </Button>
                )}

                {isOrganizer && battle.status === 'registration' && participantCount >= 2 && (
                  <Button
                    onClick={handleStartBattle}
                    disabled={startBattleMutation.isPending}
                    size="sm"
                    variant="secondary"
                    className="flex-1 h-8 text-sm"
                  >
                    {startBattleMutation.isPending ? 'Запуск...' : 'Запустить'}
                  </Button>
                )}

                {battle.status === 'registration' && isUserParticipant && (
                  <Button disabled size="sm" className="flex-1 h-8 text-sm flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{countdown || 'Ожидание'}</span>
                  </Button>
                )}

                {battle.status === 'active' && isUserParticipant && (
                  <Button disabled size="sm" variant="secondary" className="flex-1 h-8 text-sm">
                    Участвую
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Expanded Description */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 leading-relaxed">
                {battle.description}
              </p>
              
              {battle.status === 'active' && battle.current_participant_id && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 font-medium">
                    Сейчас ход участника: {battle.current_participant_id}
                  </p>
                </div>
              )}

              {/* Participants List */}
              {participantCount > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">
                    Участники ({participantCount}):
                  </h4>
                  <div className="space-y-1">
                    {activeParticipants.slice(0, 5).map((participant) => (
                      <div
                        key={participant.id}
                        className={`flex items-center justify-between text-sm p-2 rounded ${
                          participant.id === battle.current_participant_id 
                            ? 'bg-yellow-100 border border-yellow-300' 
                            : 'bg-gray-50'
                        }`}
                      >
                        <span className="font-medium">
                          {(participant as any).profiles?.first_name || 'Участник'}
                        </span>
                        <div className="flex items-center gap-2">
                          {participant.full_letters && (
                            <Badge variant="destructive" className="text-xs">
                              {participant.full_letters}
                            </Badge>
                          )}
                          {participant.id === battle.current_participant_id && (
                            <Badge className="text-xs bg-yellow-500">Ход</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {participantCount > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{participantCount - 5} участников
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default VideoBattleCard;
