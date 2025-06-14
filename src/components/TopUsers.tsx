import React from 'react';
import { Trophy, Crown, Medal, Award } from 'lucide-react';
import { useTopUsers } from '@/hooks/useWinnerSystem';
import { Loader2 } from 'lucide-react';
import PremiumBadge from './PremiumBadge';
const TopUsers: React.FC = () => {
  const {
    data: topUsers,
    isLoading,
    error
  } = useTopUsers();
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[300px] pb-16 bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>;
  }
  if (error) {
    return <div className="p-3 pb-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          Ошибка загрузки рейтинга пользователей
        </div>
      </div>;
  }
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-5 h-5" />;
      case 1:
        return <Medal className="w-5 h-5" />;
      case 2:
        return <Award className="w-5 h-5" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-400" />;
    }
  };
  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-yellow-400';
      case 1:
        return 'bg-gray-400';
      case 2:
        return 'bg-amber-500';
      default:
        return 'bg-blue-500';
    }
  };
  return <div className="pb-16 bg-gray-50 min-h-screen">
      {/* Header */}
      

      {/* Top 3 Podium */}
      {topUsers && topUsers.length >= 3 && <div className="p-4 pt-6 pb-6 text-center bg-white border-b border-gray-200">
          <div className="flex justify-center items-end space-x-2">
            {/* 2nd place */}
            <div className="flex flex-col items-center w-1/4">
              <div className="relative">
                <img src={topUsers[1]?.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face'} alt={topUsers[1]?.user?.username || 'Роллер'} className="w-16 h-16 rounded-full border-4 border-gray-300 shadow-md" />
                <div className="absolute -bottom-2 -right-2 bg-gray-300 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white">2</div>
              </div>
              <div className="mt-3 text-center">
                <div className="text-sm font-bold text-gray-800 truncate flex items-center justify-center gap-1">
                  <span className="max-w-[80px] truncate">{topUsers[1]?.user?.username || topUsers[1]?.user?.telegram_username || 'Роллер'}</span>
                  {topUsers[1]?.user?.is_premium && <PremiumBadge size="sm" />}
                </div>
                <div className="text-xs text-gray-500">{topUsers[1]?.total_points || 0} баллов</div>
              </div>
            </div>

            {/* 1st place */}
            <div className="flex flex-col items-center w-1/3">
              <div className="relative">
                <img src={topUsers[0]?.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop&crop=face'} alt={topUsers[0]?.user?.username || 'Роллер'} className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-lg" />
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-base border-2 border-white">
                  <Crown className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-center">
                <div className="text-base font-bold text-gray-900 truncate flex items-center justify-center gap-1">
                  <span className="max-w-[100px] truncate">{topUsers[0]?.user?.username || topUsers[0]?.user?.telegram_username || 'Роллер'}</span>
                  {topUsers[0]?.user?.is_premium && <PremiumBadge size="sm" />}
                </div>
                <div className="text-sm text-yellow-600 font-semibold">{topUsers[0]?.total_points || 0} баллов</div>
              </div>
            </div>

            {/* 3rd place */}
            <div className="flex flex-col items-center w-1/4">
              <div className="relative">
                <img src={topUsers[2]?.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face'} alt={topUsers[2]?.user?.username || 'Роллер'} className="w-16 h-16 rounded-full border-4 border-amber-500 shadow-md" />
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white">3</div>
              </div>
              <div className="mt-3 text-center">
                <div className="text-sm font-bold text-gray-800 truncate flex items-center justify-center gap-1">
                  <span className="max-w-[80px] truncate">{topUsers[2]?.user?.username || topUsers[2]?.user?.telegram_username || 'Роллер'}</span>
                  {topUsers[2]?.user?.is_premium && <PremiumBadge size="sm" />}
                </div>
                <div className="text-xs text-gray-500">{topUsers[2]?.total_points || 0} баллов</div>
              </div>
            </div>
          </div>
        </div>}

      {/* Full Rankings */}
      <div className="p-3">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Общий рейтинг</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {topUsers?.map((userPoint, index) => <div key={userPoint.id} className="p-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-base font-bold shadow-inner ${getRankColor(index)}`}>
                    {index < 3 ? getRankIcon(index) : index + 1}
                  </div>
                </div>
                
                <img src={userPoint.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face'} alt={userPoint.user?.username || 'Роллер'} className="w-10 h-10 rounded-full" />
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 flex items-center gap-1.5">
                    <span className="truncate">{userPoint.user?.username || userPoint.user?.telegram_username || 'Роллер'}</span>
                    {userPoint.user?.is_premium && <PremiumBadge size="sm" />}
                  </div>
                  {userPoint.user?.first_name && userPoint.user?.last_name && <div className="text-sm text-gray-500 truncate">
                      {userPoint.user.first_name} {userPoint.user.last_name}
                    </div>}
                </div>
                
                <div className="text-right">
                  <div className="text-base font-bold text-blue-600">{userPoint.total_points || 0}</div>
                  <div className="text-xs text-gray-500 -mt-1">баллов</div>
                  {userPoint.wins_count > 0 && <div className="text-xs text-yellow-600 font-medium flex items-center justify-end gap-1 mt-1">
                      <Trophy className="w-3 h-3" />
                      <span>{userPoint.wins_count}</span>
                    </div>}
                </div>
              </div>)}
          </div>
          
          {(!topUsers || topUsers.length === 0) && <div className="p-6 text-center text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Пока нет пользователей в рейтинге</p>
            </div>}
        </div>
      </div>
    </div>;
};
export default TopUsers;