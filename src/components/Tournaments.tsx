
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Plus, Zap, Sword } from 'lucide-react';
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

  // Сортируем батлы: активные, затем регистрация, затем завершенные
  const sortedBattles = battles?.sort((a, b) => {
    const statusOrder = { 'active': 0, 'registration': 1, 'completed': 2, 'cancelled': 3 };
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
    
    if (aOrder !== bOrder) return aOrder - bOrder;
    
    // В рамках одного статуса сортируем по дате
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const renderContent = () => {
    if (isLoadingBattles) {
      return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Zap className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Загрузка</h3>
            <p className="text-gray-600">Получаем список видеобатлов...</p>
          </div>
        </div>
      );
    }

    if (!battles || battles.length === 0) {
      return (
        <div className="text-center p-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Sword className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Нет активных видеобатлов</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Скоро здесь появятся захватывающие соревнования! Следите за обновлениями.
          </p>
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

    const formattedBattles = sortedBattles?.map(battle => ({
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
    })) || [];

    // Группируем батлы по статусу для лучшего отображения
    const activeBattles = formattedBattles.filter(b => b.status === 'active');
    const registrationBattles = formattedBattles.filter(b => b.status === 'registration');
    const completedBattles = formattedBattles.filter(b => b.status === 'completed');

    return (
      <div className="space-y-6">
        {canCreateBattle && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-purple-900 mb-1">Управление видеобатлами</h3>
                <p className="text-sm text-purple-700">Создайте новый видеобатл для участников</p>
              </div>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать
              </Button>
            </div>
          </div>
        )}

        {/* Активные батлы */}
        {activeBattles.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Активные батлы
            </h2>
            {activeBattles.map((battle) => (
              <VideoBattleCard key={battle.id} battle={battle} />
            ))}
          </div>
        )}

        {/* Батлы в регистрации */}
        {registrationBattles.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Открыта регистрация
            </h2>
            {registrationBattles.map((battle) => (
              <VideoBattleCard key={battle.id} battle={battle} />
            ))}
          </div>
        )}

        {/* Завершенные батлы */}
        {completedBattles.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              Завершенные батлы
            </h2>
            <div className="space-y-2">
              {completedBattles.map((battle) => (
                <VideoBattleCard key={battle.id} battle={battle} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
        <div className="px-4 py-6 max-w-2xl mx-auto">
          <TournamentBannerCarousel />

          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <Sword className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
                Видеобатлы
              </h1>
            </div>
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
