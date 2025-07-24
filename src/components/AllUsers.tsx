
import React, { useState, useMemo } from 'react';
import { Search, User } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { Loader2 } from 'lucide-react';
import PremiumBadge from './PremiumBadge';
import { Input } from '@/components/ui/input';
import FullScreenUserProfileModal from './FullScreenUserProfileModal';

const AllUsers: React.FC = () => {
  const { data: users, isLoading, error } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!users || !searchQuery.trim()) return users || [];
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.username?.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.telegram_username?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleCloseModal = () => {
    setSelectedUserId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] pb-16 bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 pb-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          Ошибка загрузки пользователей
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 bg-gray-50 min-h-screen">
      {/* Search */}
      <div className="p-3 bg-white border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="p-3">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              {searchQuery ? `Результаты поиска (${filteredUsers.length})` : `Все пользователи (${users?.length || 0})`}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleUserClick(user.id)}
              >
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face'}
                  alt={user.username || 'Пользователь'}
                  className="w-10 h-10 rounded-full"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 flex items-center gap-1.5">
                    <span className="truncate">
                      {user.username || user.telegram_username || 'Пользователь'}
                    </span>
                    {user.is_premium && <PremiumBadge size="sm" />}
                  </div>
                  {user.first_name && user.last_name && (
                    <div className="text-sm text-gray-500 truncate">
                      {user.first_name} {user.last_name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>
                {searchQuery ? 'Пользователи не найдены' : 'Пока нет пользователей'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {selectedUserId && (
        <FullScreenUserProfileModal 
          isOpen={!!selectedUserId} 
          onClose={handleCloseModal} 
          userId={selectedUserId} 
        />
      )}
    </div>
  );
};

export default AllUsers;
