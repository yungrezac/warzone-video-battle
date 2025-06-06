
import React, { useState } from 'react';
import { MessageSquare, Users, Plus, Pin, Flame, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  postCount: number;
  lastActivity: string;
  avatar: string;
  isJoined: boolean;
  category: 'local' | 'tricks' | 'equipment' | 'events';
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  communityName: string;
  timestamp: string;
  likes: number;
  comments: number;
  isPinned?: boolean;
  isHot?: boolean;
}

const CommunityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('communities');

  const communities: Community[] = [
    {
      id: '1',
      name: 'Роллеры Москвы',
      description: 'Сообщество роллеров Москвы и МО. Катания, встречи, соревнования',
      memberCount: 1247,
      postCount: 892,
      lastActivity: '5 мин назад',
      avatar: '🏙️',
      isJoined: true,
      category: 'local'
    },
    {
      id: '2',
      name: 'Трюки и фристайл',
      description: 'Изучаем новые трюки, делимся опытом и прогрессом',
      memberCount: 856,
      postCount: 456,
      lastActivity: '12 мин назад',
      avatar: '🤸',
      isJoined: false,
      category: 'tricks'
    },
    {
      id: '3',
      name: 'Роллер оборудование',
      description: 'Обзоры, советы по выбору роликов и защиты',
      memberCount: 523,
      postCount: 234,
      lastActivity: '1 час назад',
      avatar: '⚙️',
      isJoined: true,
      category: 'equipment'
    },
    {
      id: '4',
      name: 'Роллер события',
      description: 'Анонсы соревнований, встреч и мероприятий',
      memberCount: 734,
      postCount: 167,
      lastActivity: '2 часа назад',
      avatar: '🎉',
      isJoined: false,
      category: 'events'
    }
  ];

  const posts: Post[] = [
    {
      id: '1',
      title: 'Встреча роллеров в Сокольниках - 15 июня',
      content: 'Друзья, организуем встречу в Сокольниках! Будем кататься по аллеям, делиться опытом...',
      author: 'event_master',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face',
      communityName: 'Роллеры Москвы',
      timestamp: '10 мин назад',
      likes: 23,
      comments: 8,
      isPinned: true
    },
    {
      id: '2',
      title: 'Освоил новый трюк - 360 jump!',
      content: 'После месяца тренировок наконец-то получился чистый 360! Делюсь видео...',
      author: 'trick_lover',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=40&h=40&fit=crop&crop=face',
      communityName: 'Трюки и фристайл',
      timestamp: '1 час назад',
      likes: 45,
      comments: 12,
      isHot: true
    },
    {
      id: '3',
      title: 'Обзор новых роликов Rollerblade Twister',
      content: 'Протестировал новую модель, делюсь впечатлениями и сравнением с предыдущей версией...',
      author: 'gear_expert',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      communityName: 'Роллер оборудование',
      timestamp: '3 часа назад',
      likes: 18,
      comments: 5
    }
  ];

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'local': return 'Локальные';
      case 'tricks': return 'Трюки';
      case 'equipment': return 'Оборудование';
      case 'events': return 'События';
      default: return 'Все';
    }
  };

  const handleJoinCommunity = (communityId: string) => {
    console.log('Присоединяемся к сообществу:', communityId);
  };

  return (
    <div className="pb-16">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-3">
        <h1 className="text-xl font-bold">Сообщества</h1>
        <p className="text-green-100 text-sm">Общение и обмен опытом</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 m-2">
          <TabsTrigger value="communities" className="text-xs">Сообщества</TabsTrigger>
          <TabsTrigger value="feed" className="text-xs">Лента</TabsTrigger>
        </TabsList>

        <TabsContent value="communities" className="m-0">
          <div className="p-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Все сообщества</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Создать
              </Button>
            </div>

            <div className="space-y-3">
              {communities.map(community => (
                <Card key={community.id} className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{community.avatar}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-sm mb-1">{community.name}</h3>
                          <p className="text-xs text-gray-600 mb-2">{community.description}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {community.memberCount}
                            </span>
                            <span className="flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {community.postCount}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {community.lastActivity}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge variant="outline" className="text-xs">
                            {getCategoryName(community.category)}
                          </Badge>
                          <Button
                            size="sm"
                            variant={community.isJoined ? "outline" : "default"}
                            onClick={() => handleJoinCommunity(community.id)}
                            className="text-xs"
                          >
                            {community.isJoined ? 'Покинуть' : 'Вступить'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="feed" className="m-0">
          <div className="p-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Лента сообществ</h2>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Пост
              </Button>
            </div>

            <div className="space-y-3">
              {posts.map(post => (
                <Card key={post.id} className="p-3">
                  <div className="flex items-start space-x-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.author}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm">@{post.author}</span>
                        <span className="text-xs text-gray-500">в</span>
                        <span className="text-xs text-blue-600">{post.communityName}</span>
                        <span className="text-xs text-gray-500">{post.timestamp}</span>
                        {post.isPinned && <Pin className="w-3 h-3 text-green-600" />}
                        {post.isHot && <Flame className="w-3 h-3 text-red-600" />}
                      </div>
                      
                      <h3 className="font-semibold text-sm mb-1">{post.title}</h3>
                      <p className="text-xs text-gray-600 mb-2">{post.content}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <button className="flex items-center hover:text-red-500">
                          <span className="mr-1">❤️</span>
                          {post.likes}
                        </button>
                        <button className="flex items-center hover:text-blue-500">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {post.comments}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityPage;
