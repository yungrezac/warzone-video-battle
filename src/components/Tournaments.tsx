
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from './AuthWrapper';
import { useVideoBattles } from '@/hooks/useVideoBattles';
import VideoBattleCard from './VideoBattleCard';
import CreateBattleModal from './CreateBattleModal';
import TournamentBannerCarousel from './TournamentBannerCarousel';

const Tournaments: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { user } = useAuth();
  const { data: battles, isLoading: isLoadingBattles } = useVideoBattles();
  
  const canCreateBattle = user?.id === '649d5b0d-88f6-49fb-85dc-a88d6cba1327';

  const renderContent = () => {
    if (isLoadingBattles) {
      return (
        <div className="text-center p-8">
          <p className="text-gray-500">Загрузка видеобатлов...</p>
        </div>
      );
    }

    if (!battles || battles.length === 0) {
      return (
        <div className="text-center p-8 border-2 border-dashed rounded-xl bg-gray-50">
          <p className="text-gray-500 mb-4">Нет активных видеобатлов</p>
          {canCreateBattle && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Создать видеобатл
            </Button>
          )}
        </div>
      );
    }

    // Приводим батлы к нужному типу
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
      winner_id: battle.winner_id || undefined,
      prize_points: battle.prize_points,
      winner: undefined, // Убираем winner пока не исправим связи в БД
    }));

    return (
      <div className="space-y-6">
        {/* Административная панель для создания батлов */}
        {canCreateBattle && (
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-900">Управление видеобатлами</h3>
                <p className="text-sm text-red-700">Создайте новый видеобатл</p>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Создать видеобатл
              </Button>
            </div>
          </div>
        )}

        {/* Список видеобатлов */}
        {formattedBattles.map((battle) => (
          <VideoBattleCard
            key={battle.id}
            battle={battle}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="pb-16 p-4 px-[10px] py-[10px]">
        <TournamentBannerCarousel />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 px-[4px]">Видеобатлы</h1>
          <p className="text-gray-600 text-sm px-[4px]">
            Соревнуйтесь в повторении трюков и добавлении новых элементов
          </p>
        </div>

        {renderContent()}
      </div>

      {/* Модальное окно создания */}
      <CreateBattleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};

export default Tournaments;
