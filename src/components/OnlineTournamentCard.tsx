
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Star, 
  ChevronDown, 
  ChevronUp,
  Upload,
  Crown
} from 'lucide-react';
import { useAuth } from '@/components/AuthWrapper';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useJoinTournament, useTournamentParticipants } from '@/hooks/useOnlineTournaments';
import { toast } from 'sonner';

interface OnlineTournamentCardProps {
  tournament: {
    id: string;
    title: string;
    description: string;
    banner_url: string;
    entry_cost_points: number;
    min_participants: number;
    end_date: string;
    status: 'registration' | 'active' | 'completed';
    participants_count: number;
    winner_id?: string;
    profiles?: {
      username?: string;
      first_name?: string;
      avatar_url?: string;
    };
  };
  onUploadVideo?: (tournamentId: string) => void;
}

const OnlineTournamentCard: React.FC<OnlineTournamentCardProps> = ({ 
  tournament, 
  onUploadVideo 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const joinTournamentMutation = useJoinTournament();
  const { data: participants } = useTournamentParticipants(tournament.id);

  const isUserParticipant = participants?.some(p => p.user_id === user?.id);
  const userParticipant = participants?.find(p => p.user_id === user?.id);
  const hasUploadedVideo = userParticipant?.video_id;

  const canUpload = tournament.status === 'active' && isUserParticipant && !hasUploadedVideo;
  const canJoin = tournament.status === 'registration' && !isUserParticipant;

  const handleJoinTournament = async () => {
    if (!user || !userProfile) {
      toast.error('Войдите в систему для участия в турнире');
      return;
    }

    if (userProfile.total_points < tournament.entry_cost_points) {
      toast.error('Недостаточно баллов для участия в турнире');
      return;
    }

    joinTournamentMutation.mutate({
      tournamentId: tournament.id,
      userId: user.id,
    });
  };

  const getStatusBadge = () => {
    switch (tournament.status) {
      case 'registration':
        return <Badge className="bg-blue-500">Регистрация</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Активный</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Завершен</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (tournament.status === 'completed' && tournament.winner_id && tournament.profiles) {
    return (
      <Card className="w-full mb-6 border-yellow-400 border-2">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={tournament.banner_url}
            alt={tournament.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center text-white">
              <Crown className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
              <h3 className="text-xl font-bold">ТУРНИР ЗАВЕРШЕН</h3>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold mb-2">{tournament.title}</h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              <img
                src={tournament.profiles.avatar_url || '/placeholder-avatar.png'}
                alt="Winner"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-semibold">
                  Победитель: {tournament.profiles.first_name || tournament.profiles.username}
                </p>
                <p className="text-sm text-gray-600">
                  Участников: {tournament.participants_count}
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
      <div className="relative">
        <img
          src={tournament.banner_url}
          alt={tournament.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-4 right-4">
          {getStatusBadge()}
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{tournament.title}</span>
          <Trophy className="w-5 h-5 text-yellow-500" />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{tournament.participants_count}/{tournament.min_participants}+</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            <span>{tournament.entry_cost_points} баллов</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(tournament.end_date)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className={`text-gray-700 ${isExpanded ? '' : 'line-clamp-2'}`}>
            {tournament.description}
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

        <div className="flex gap-2">
          {canJoin && (
            <Button
              onClick={handleJoinTournament}
              disabled={joinTournamentMutation.isPending}
              className="flex-1"
            >
              {joinTournamentMutation.isPending ? 'Присоединение...' : 'Участвовать'}
            </Button>
          )}

          {canUpload && onUploadVideo && (
            <Button
              onClick={() => onUploadVideo(tournament.id)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Загрузить видео
            </Button>
          )}

          {isUserParticipant && hasUploadedVideo && (
            <Button disabled className="flex-1 bg-gray-400">
              Видео загружено
            </Button>
          )}

          {tournament.status === 'registration' && isUserParticipant && (
            <Button disabled className="flex-1 bg-blue-400">
              Ожидание старта
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnlineTournamentCard;
