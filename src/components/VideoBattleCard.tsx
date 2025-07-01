
import React, { useState } from 'react';
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
  Crown
} from 'lucide-react';
import { useAuth } from '@/components/AuthWrapper';
import { useJoinBattle, useBattleParticipants } from '@/hooks/useVideoBattles';
import VideoPlayer from './VideoPlayer';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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
    winner_id?: string;
    prize_points: number;
    winner?: {
      username?: string;
      first_name?: string;
      avatar_url?: string;
    };
  };
}

const VideoBattleCard: React.FC<VideoBattleCardProps> = ({ battle }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const joinBattleMutation = useJoinBattle();
  const { data: participants } = useBattleParticipants(battle.id);

  const isUserParticipant = participants?.some(p => p.user_id === user?.id);
  const canJoin = battle.status === 'registration' && !isUserParticipant;

  const handleJoinBattle = async () => {
    if (!user) {
      return;
    }

    joinBattleMutation.mutate({
      battleId: battle.id,
      userId: user.id,
    });
  };

  const getStatusBadge = () => {
    switch (battle.status) {
      case 'registration':
        return <Badge className="bg-blue-500">Регистрация</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Активный</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Завершен</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Отменен</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (battle.status === 'completed' && battle.winner_id && battle.winner) {
    return (
      <Card className="w-full mb-6 border-yellow-400 border-2">
        <CardContent className="p-4">
          <div className="text-center">
            <Crown className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
            <h3 className="text-lg font-bold mb-2">БАТЛ ЗАВЕРШЕН</h3>
            <h4 className="text-md font-semibold mb-4">{battle.title}</h4>
            <div className="flex items-center justify-center gap-2 mb-4">
              <img
                src={battle.winner.avatar_url || '/placeholder-avatar.png'}
                alt="Winner"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-semibold">
                  Победитель: {battle.winner.first_name || battle.winner.username}
                </p>
                <p className="text-sm text-gray-600">
                  Участников: {participants?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sword className="w-5 h-5 text-red-500" />
            <span>{battle.title}</span>
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Эталонное видео */}
        <div>
          <h4 className="font-semibold mb-2">Эталонное видео:</h4>
          <div className="rounded-lg overflow-hidden">
            <AspectRatio ratio={16 / 9} className="bg-black">
              <VideoPlayer
                src={battle.reference_video_url}
                title={battle.reference_video_title}
                className="w-full h-full"
                videoId={`battle-ref-${battle.id}`}
              />
            </AspectRatio>
          </div>
          <p className="text-sm text-gray-600 mt-1">{battle.reference_video_title}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{participants?.length || 0} участников</span>
          </div>
          <div className="flex items-center gap-1">
            <Timer className="w-4 h-4" />
            <span>{battle.time_limit_minutes} мин</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            <span>{battle.prize_points} баллов</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(battle.start_time)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className={`text-gray-700 ${isExpanded ? '' : 'line-clamp-2'}`}>
            {battle.description}
          </p>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0 h-auto text-blue-600 hover:text-blue-800"
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
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Сейчас ход участника:</strong> {battle.current_participant_id}
            </p>
            {battle.current_deadline && (
              <p className="text-xs text-yellow-700">
                Дедлайн: {formatDate(battle.current_deadline)}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {canJoin && (
            <Button
              onClick={handleJoinBattle}
              disabled={joinBattleMutation.isPending}
              className="flex-1"
            >
              {joinBattleMutation.isPending ? 'Присоединение...' : 'Участвовать'}
            </Button>
          )}

          {battle.status === 'registration' && isUserParticipant && (
            <Button disabled className="flex-1 bg-blue-400">
              Ожидание старта
            </Button>
          )}

          {battle.status === 'active' && isUserParticipant && (
            <Button disabled className="flex-1 bg-green-400">
              Участвую в батле
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoBattleCard;
