
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Plus, Zap } from 'lucide-react';
import { useAuth } from './AuthWrapper';
import { useVideoBattles } from '@/hooks/useVideoBattles';
import VideoBattleCard from './VideoBattleCard';
import CreateBattleModal from './CreateBattleModal';
import TournamentBannerCarousel from './TournamentBannerCarousel';

const Tournaments: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { user } = useAuth();
  const { data: battles, isLoading: isLoadingBattles } = useVideoBattles();
  
  const canCreateBattle = user?.username === 'TrickMaster' || user?.id === '649d5b0d-88f6-49fb-85dc-a88d6cba1327';

  const renderContent = () => {
    if (isLoadingBattles) {
      return (
        <div className="text-center p-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
            <Zap className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Загрузка видеобатлов...</p>
        </div>
      );
    }

    if (!battles || battles.length === 0) {
      return (
        <div className="text-center p-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-sm">
            <Zap className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Нет активных видеобатлов</h3>
          <p className="text-gray-600 mb-6">Скоро здесь появятся захватывающие соревнования!</p>
          {canCreateBattle && (
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Создать видеобатл
            </Button>
          )}
        </div>
      );
    }

    const formattedBattles = battles.map(battle => ({
      id: battle.id,
      title: battle.title,
      description: battle.description,
      reference_video_url: battle.reference_video_url,
      reference_video_title: battle.reference_video_title,
      start_time: battle.start_time,
      time_limit_minutes: battle.time_limit_minutes,
      status: battle.status as 'registration' | 'active' | 'completed' | 'cancelled',
      current_participant_id: battle.current_participant_id || undefined,
      current_deadline: battle.current_deadline || undefined,
      current_video_sequence: battle.current_video_sequence || 1,
      winner_id: battle.winner_id || undefined,
      prize_points: battle.prize_points,
      organizer_id: battle.organizer_id,
      winner: undefined,
    }));

    return (
      <div className="space-y-8">
        {canCreateBattle && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-purple-900">Управление видеобатлами</h3>
                <p className="text-sm text-purple-700">Создайте новый видеобатл для пользователей</p>
              </div>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {formattedBattles.map((battle) => (
            <VideoBattleCard
              key={battle.id}
              battle={battle}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
        <div className="px-4 py-6">
          <TournamentBannerCarousel />

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent mb-3">
              Видеобатлы
            </h1>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              Соревнуйтесь в повторении трюков и добавлении новых элементов
            </p>
          </div>

          {renderContent()}
        </div>
      </div>

      <CreateBattleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};

export default Tournaments;
