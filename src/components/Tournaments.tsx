
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wifi, WifiOff, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from './AuthWrapper';
import { useOnlineTournaments, useTournamentVideos } from '@/hooks/useOnlineTournaments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import OnlineTournamentCard from './OnlineTournamentCard';
import TournamentVideoCard from './TournamentVideoCard';
import CreateTournamentModal from './CreateTournamentModal';
import TournamentUploadModal from './TournamentUploadModal';
import TournamentBannerCarousel from './TournamentBannerCarousel';
import TournamentDetailsModal from './TournamentDetailsModal';

const Tournaments: React.FC = () => {
  const [modalType, setModalType] = useState<'online' | 'offline' | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [uploadTournamentId, setUploadTournamentId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { data: tournaments, isLoading: isLoadingTournaments } = useOnlineTournaments();
  
  // Получаем активный турнир (первый по дате создания)
  const activeTournament = tournaments?.[0];
  
  const { data: tournamentVideos } = useTournamentVideos(activeTournament?.id || '');
  
  // Проверяем, является ли пользователь судьей активного турнира
  const { data: isJudge } = useQuery({
    queryKey: ['is-judge', activeTournament?.id, user?.id],
    queryFn: async () => {
      if (!activeTournament?.id || !user?.id) return false;
      
      const { data, error } = await supabase
        .from('tournament_judges')
        .select('id')
        .eq('tournament_id', activeTournament.id)
        .eq('judge_id', user.id)
        .maybeSingle();

      if (error) return false;
      return !!data;
    },
    enabled: !!activeTournament?.id && !!user?.id,
  });

  const canCreateTournament = user?.id === '649d5b0d-88f6-49fb-85dc-a88d6cba1327';

  const handleUploadVideo = (tournamentId: string) => {
    setUploadTournamentId(tournamentId);
  };

  const renderOnlineContent = () => {
    if (isLoadingTournaments) {
      return (
        <div className="text-center p-8">
          <p className="text-gray-500">Загрузка турниров...</p>
        </div>
      );
    }

    if (!activeTournament) {
      return (
        <div className="text-center p-8 border-2 border-dashed rounded-xl bg-gray-50">
          <p className="text-gray-500 mb-4">Нет активных турниров</p>
          {canCreateTournament && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Создать турнир
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Административная панель для создания турниров */}
        {canCreateTournament && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Управление турнирами</h3>
                <p className="text-sm text-blue-700">Создайте новый турнир</p>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Создать турнир
              </Button>
            </div>
          </div>
        )}

        {/* Карточка турнира */}
        <OnlineTournamentCard
          tournament={activeTournament}
          onUploadVideo={handleUploadVideo}
        />

        {/* Лента турнирных видео */}
        {tournamentVideos && tournamentVideos.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Видео участников</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournamentVideos.map((video) => (
                <TournamentVideoCard
                  key={video.id}
                  video={video}
                  isJudge={isJudge}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOfflineContent = () => (
    <div className="text-center p-8 border-2 border-dashed rounded-xl bg-gray-50">
      <p className="text-gray-500 mb-4">Пока нет офлайн турниров</p>
      <Button onClick={() => setModalType('offline')}>
        Подробнее
      </Button>
    </div>
  );

  return (
    <>
      <div className="pb-16 p-4 px-[10px] py-[10px]">
        <TournamentBannerCarousel />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 px-[4px]">Турниры</h1>
        </div>

        <Tabs defaultValue="online" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="online" className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Онлайн
            </TabsTrigger>
            <TabsTrigger value="offline" className="flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              Офлайн
            </TabsTrigger>
          </TabsList>

          <TabsContent value="online">
            {renderOnlineContent()}
          </TabsContent>

          <TabsContent value="offline">
            {renderOfflineContent()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Модальные окна */}
      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <TournamentUploadModal
        isOpen={!!uploadTournamentId}
        onClose={() => setUploadTournamentId(null)}
        tournamentId={uploadTournamentId || ''}
      />
      
      <TournamentDetailsModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        type={modalType}
      />
    </>
  );
};

export default Tournaments;
