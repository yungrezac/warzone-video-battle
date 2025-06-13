import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import VideoCard from './VideoCard';
import VideoCardSkeleton from './VideoCardSkeleton';
import AdminWinnerControl from './AdminWinnerControl';
import WinnerAnnouncement from './WinnerAnnouncement';

interface Tournament {
  id: string;
  created_at: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  prize_pool: number;
}

const Tournaments: React.FC = () => {
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isWinnerControlOpen, setIsWinnerControlOpen] = useState(false);

  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching tournaments:', error);
        throw error;
      }
      return data || [];
    },
  });

  const { data: tournamentVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['tournamentVideos', selectedTournament?.id],
    queryFn: async () => {
      if (!selectedTournament?.id) return [];
      
      const { data, error } = await supabase
        .from('tournament_videos')
        .select(`
          *,
          profiles:user_id (
            username,
            telegram_username,
            avatar_url
          )
        `)
        .eq('tournament_id', selectedTournament.id)
        .order('views', { ascending: false });

      if (error) {
        console.error('Error fetching tournament videos:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!selectedTournament?.id,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4">
        {/* Tournament Selection */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Выберите турнир</h2>
          <div className="grid gap-3">
            {tournaments?.map((tournament) => (
              <div
                key={tournament.id}
                onClick={() => setSelectedTournament(tournament)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedTournament?.id === tournament.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold">{tournament.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{tournament.description}</p>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>Призовой фонд: {tournament.prize_pool}₽</span>
                  <span>
                    {format(new Date(tournament.start_date), 'dd.MM.yyyy')} - 
                    {format(new Date(tournament.end_date), 'dd.MM.yyyy')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tournament Videos */}
        {selectedTournament && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Участники турнира</h3>
              <Button
                onClick={() => setIsWinnerControlOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Выбрать победителя
              </Button>
            </div>

            {videosLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <VideoCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournamentVideos.map((video) => (
                  <div key={video.id} className="relative">
                    <VideoCard
                      video={{
                        ...video,
                        username: video.profiles?.username || 'Неизвестный пользователь',
                        telegram_username: video.profiles?.telegram_username || '',
                        avatar_url: video.profiles?.avatar_url || ''
                      }}
                    />
                    {video.is_winner && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                        <Trophy className="w-3 h-3 mr-1" />
                        Победитель
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tournamentVideos.length === 0 && !videosLoading && (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>В этом турнире пока нет участников</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Winner Control Modal */}
      {selectedTournament && (
        <AdminWinnerControl
          isOpen={isWinnerControlOpen}
          onClose={() => setIsWinnerControlOpen(false)}
          tournamentId={selectedTournament.id}
          videos={tournamentVideos}
        />
      )}

      {/* Winner Announcement */}
      <WinnerAnnouncement />
    </div>
  );
};

export default Tournaments;
