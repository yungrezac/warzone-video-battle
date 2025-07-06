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

  // Компактный вид для завершенных батлов
  if (battle.status === 'completed') {
    return (
      <Card className="overflow-hidden bg-muted/30 border border-muted shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-muted-foreground truncate">
                Завершен • {battle.title}
              </h4>
              {battle.winner && (
                <p className="text-xs text-muted-foreground mt-1">
                  Победитель: {battle.winner.first_name || battle.winner.username} • {participantCount} участников
                </p>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
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
      
      <Card className="overflow-hidden bg-card shadow-md hover:shadow-lg transition-all duration-300 border">
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-primary/10 rounded-full">
                <Sword className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold truncate">{battle.title}</span>
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-4">
          <div className="flex gap-4">
            {/* Video */}
            <div className="flex-shrink-0">
              <div className="relative rounded-lg overflow-hidden shadow-sm bg-black">
                <AspectRatio ratio={9 / 16} className="w-24">
                  <VideoPlayer
                    src={battle.reference_video_url}
                    thumbnail="/placeholder.svg"
                    title={battle.reference_video_title}
                    className="w-full h-full"
                    videoId={`battle-ref-${battle.id}`}
                  />
                </AspectRatio>
                <div className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5">
                  <Play className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-md p-2">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium">{participantCount}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-md p-2">
                  <Timer className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium">{battle.time_limit_minutes}м</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-md p-2">
                  <Star className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium">{battle.prize_points}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-md p-2">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium text-[10px] leading-tight">
                    {formatDate(battle.start_time).split(',')[0].split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {battle.description}
              </p>
            </div>
          </div>

          {battle.status === 'active' && battle.current_participant_id && (
            <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg">
              <p className="text-xs text-warning-foreground font-medium">
                Ход участника: {battle.current_participant_id}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {canJoin && (
              <Button
                onClick={handleJoinBattle}
                disabled={joinBattleMutation.isPending}
                size="sm"
                className="flex-1"
              >
                {joinBattleMutation.isPending ? 'Присоединение...' : 'Участвовать'}
              </Button>
            )}

            {isOrganizer && battle.status === 'registration' && participantCount >= 2 && (
              <Button
                onClick={handleStartBattle}
                disabled={startBattleMutation.isPending}
                size="sm"
                variant="secondary"
                className="flex-1"
              >
                {startBattleMutation.isPending ? 'Запуск...' : 'Запустить'}
              </Button>
            )}

            {battle.status === 'registration' && isUserParticipant && (
              <Button disabled size="sm" className="flex-1 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{countdown || 'Ожидание'}</span>
              </Button>
            )}

            {battle.status === 'active' && isUserParticipant && (
              <Button disabled size="sm" variant="secondary" className="flex-1">
                Участвую
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default VideoBattleCard;
