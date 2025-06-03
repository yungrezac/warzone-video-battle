
import React from 'react';
import { Edit, Calendar, Trophy, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Profile: React.FC = () => {
  const userData = {
    name: 'ProGamer123',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    joinDate: 'Ноябрь 2024',
    totalVideos: 12,
    totalLikes: 1432,
    totalViews: 8765,
    balance: 856,
    rank: 'Золото',
    winsCount: 3
  };

  const userVideos = [
    {
      id: '1',
      title: 'Эпический геймплей в Warzone',
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=150&fit=crop',
      views: 1250,
      likes: 234,
      rating: 4.7,
      isWinner: true
    },
    {
      id: '2',
      title: 'Соло победа на новой карте',
      thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=150&fit=crop',
      views: 890,
      likes: 156,
      rating: 4.3,
      isWinner: false
    },
    {
      id: '3',
      title: 'Командная стратегия',
      thumbnail: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=200&h=150&fit=crop',
      views: 654,
      likes: 98,
      rating: 4.0,
      isWinner: false
    }
  ];

  return (
    <div className="pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center mb-4">
          <img
            src={userData.avatar}
            alt={userData.name}
            className="w-20 h-20 rounded-full border-4 border-white mr-4"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{userData.name}</h2>
            <div className="flex items-center mt-1 text-blue-100">
              <Calendar className="w-4 h-4 mr-1" />
              <span className="text-sm">В WZ Battle с {userData.joinDate}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-blue-600">
            <Edit className="w-4 h-4 mr-1" />
            Изменить
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{userData.balance}</div>
            <div className="text-sm opacity-90">Баллов</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{userData.winsCount}</div>
            <div className="text-sm opacity-90">Побед</div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Статистика
          </h3>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">{userData.totalVideos}</div>
              <div className="text-sm text-gray-600">Видео</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-500">{userData.totalLikes}</div>
              <div className="text-sm text-gray-600">Лайков</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-500">{userData.totalViews}</div>
              <div className="text-sm text-gray-600">Просмотров</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Ранг:</span>
              <span className="font-bold text-orange-600">{userData.rank}</span>
            </div>
          </div>
        </div>

        {/* User Videos */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Video className="w-5 h-5 mr-2 text-purple-500" />
            Мои видео ({userData.totalVideos})
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {userVideos.map(video => (
              <div key={video.id} className="flex bg-gray-50 rounded-lg p-3">
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-24 h-18 object-cover rounded-lg"
                  />
                  {video.isWinner && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1 rounded">
                      🏆
                    </div>
                  )}
                </div>
                
                <div className="ml-3 flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    {video.title}
                  </h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>👁 {video.views} • ❤️ {video.likes}</div>
                    <div>⭐ {video.rating}/5.0</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
