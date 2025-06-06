
import React from 'react';
import { MessageSquare, Users, Calendar, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CommunityPage: React.FC = () => {
  const communities = [
    {
      id: 1,
      name: 'Роллеры Москвы',
      description: 'Главное сообщество роллеров столицы',
      members: 1247,
      messages: 234,
      isJoined: true,
      avatar: '🏙️'
    },
    {
      id: 2,
      name: 'Freestyle Tricks',
      description: 'Обсуждаем сложные трюки и техники',
      members: 689,
      messages: 156,
      isJoined: false,
      avatar: '🎪'
    },
    {
      id: 3,
      name: 'Новички',
      description: 'Помощь начинающим роллерам',
      members: 892,
      messages: 89,
      isJoined: true,
      avatar: '🔰'
    }
  ];

  const events = [
    {
      id: 1,
      title: 'Покатушка в Парке Горького',
      date: '15 янв, 14:00',
      participants: 23,
      community: 'Роллеры Москвы'
    },
    {
      id: 2,
      title: 'Мастер-класс по трюкам',
      date: '18 янв, 16:00',
      participants: 15,
      community: 'Freestyle Tricks'
    }
  ];

  return (
    <div className="pb-16">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3">
        <h1 className="text-xl font-bold">Сообщества</h1>
        <p className="text-orange-100 text-sm">Найди единомышленников</p>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Мои сообщества</h2>
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            {communities.filter(c => c.isJoined).length} активных
          </Badge>
        </div>

        <div className="space-y-3 mb-6">
          {communities.map(community => (
            <Card key={community.id} className="p-3">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{community.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold">{community.name}</h3>
                    {community.isJoined && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        Участник
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{community.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {community.members}
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {community.messages}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Ближайшие события</h2>
          <div className="space-y-3">
            {events.map(event => (
              <Card key={event.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{event.title}</h3>
                    <div className="flex items-center space-x-3 text-xs text-gray-600 mt-1">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {event.date}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {event.participants}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {event.community}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-orange-600" />
            Статистика активности
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600">156</div>
              <div className="text-xs text-gray-600">Сообщений сегодня</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">12</div>
              <div className="text-xs text-gray-600">Новых участников</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
