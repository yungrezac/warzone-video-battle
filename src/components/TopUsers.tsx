
import React from 'react';
import { Trophy, Crown, Medal, Award } from 'lucide-react';
import { useTopUsers } from '@/hooks/useTopUsers';
import { Loader2 } from 'lucide-react';

const TopUsers: React.FC = () => {
  const { data: topUsers, isLoading, error } = useTopUsers();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] pb-16">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 pb-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          Ошибка загрузки рейтинга пользователей
        </div>
      </div>
    );
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 1:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 2:
        return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default:
        return 'bg-gradient-to-r from-blue-400 to-blue-600';
    }
  };

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
        <div className="flex items-center justify-center mb-2">
          <Trophy className="w-8 h-8 mr-2" />
          <h1 className="text-2xl font-bold">Рейтинг пользователей</h1>
        </div>
        <p className="text-center text-purple-100 text-sm">
          Все пользователи приложения по количеству баллов
        </p>
      </div>

      {/* Top 3 Podium */}
      {topUsers && topUsers.length >= 3 && (
        <div className="p-4 bg-gray-50">
          <div className="flex justify-center items-end space-x-2 mb-4">
            {/* 2nd place */}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-t from-gray-300 to-gray-500 text-white rounded-lg p-3 mb-2 shadow-lg">
                <img
                  src={topUsers[1]?.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face'}
                  alt={topUsers[1]?.user?.username || 'Роллер'}
                  className="w-12 h-12 rounded-full border-2 border-white"
                />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-gray-700">
                  {topUsers[1]?.user?.username || topUsers[1]?.user?.telegram_username || 'Роллер'}
                </div>
                <div className="text-xs text-gray-500">{topUsers[1]?.total_points || 0} баллов</div>
              </div>
              <div className="text-2xl font-bold text-gray-400 mt-1">2</div>
            </div>

            {/* 1st place */}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-t from-yellow-400 to-yellow-600 text-white rounded-lg p-4 mb-2 shadow-xl transform scale-110">
                <img
                  src={topUsers[0]?.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=70&h=70&fit=crop&crop=face'}
                  alt={topUsers[0]?.user?.username || 'Роллер'}
                  className="w-14 h-14 rounded-full border-2 border-white"
                />
                <Crown className="w-6 h-6 mx-auto mt-2 text-yellow-200" />
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-gray-800">
                  {topUsers[0]?.user?.username || topUsers[0]?.user?.telegram_username || 'Роллер'}
                </div>
                <div className="text-sm text-yellow-600 font-semibold">{topUsers[0]?.total_points || 0} баллов</div>
              </div>
              <div className="text-3xl font-bold text-yellow-500 mt-1">1</div>
            </div>

            {/* 3rd place */}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-t from-amber-400 to-amber-600 text-white rounded-lg p-3 mb-2 shadow-lg">
                <img
                  src={topUsers[2]?.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face'}
                  alt={topUsers[2]?.user?.username || 'Роллер'}
                  className="w-12 h-12 rounded-full border-2 border-white"
                />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-gray-700">
                  {topUsers[2]?.user?.username || topUsers[2]?.user?.telegram_username || 'Роллер'}
                </div>
                <div className="text-xs text-gray-500">{topUsers[2]?.total_points || 0} баллов</div>
              </div>
              <div className="text-2xl font-bold text-amber-500 mt-1">3</div>
            </div>
          </div>
        </div>
      )}

      {/* Full Rankings */}
      <div className="p-3">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Полный рейтинг</h3>
            <p className="text-sm text-gray-500">Всего пользователей: {topUsers?.length || 0}</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {topUsers?.map((userPoint, index) => (
              <div key={userPoint.id} className="p-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getRankColor(index)}`}>
                    {index < 3 ? getRankIcon(index) : index + 1}
                  </div>
                </div>
                
                <img
                  src={userPoint.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face'}
                  alt={userPoint.user?.username || 'Роллер'}
                  className="w-10 h-10 rounded-full border border-gray-200"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {userPoint.user?.username || userPoint.user?.telegram_username || 'Роллер'}
                  </div>
                  {userPoint.user?.first_name && userPoint.user?.last_name && (
                    <div className="text-sm text-gray-500 truncate">
                      {userPoint.user.first_name} {userPoint.user.last_name}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="text-lg font-bold text-blue-600">
                    {userPoint.total_points || 0}
                  </div>
                  <div className="text-xs text-gray-500">баллов</div>
                  {userPoint.wins_count > 0 && (
                    <div className="text-xs text-yellow-600 font-medium">
                      🏆 {userPoint.wins_count}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {(!topUsers || topUsers.length === 0) && (
            <div className="p-6 text-center text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Пока нет пользователей в приложении</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopUsers;
