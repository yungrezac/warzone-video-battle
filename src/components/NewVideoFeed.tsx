
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/AuthWrapper';
import CategoryFeed from './CategoryFeed';

interface NewVideoFeedProps {
  onNavigateToUpload?: () => void;
}

const NewVideoFeed: React.FC<NewVideoFeedProps> = ({ onNavigateToUpload }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([
    {
      id: '1',
      title: 'Добро пожаловать в RollTricks!',
      content: 'Это первый пост в общей категории. Здесь можно делиться всем, что связано с роллерспортом.',
      category: 'general',
      author: 'Admin',
      timestamp: '2 часа назад'
    },
    {
      id: '2',
      title: 'Battle сезон 2024 стартует!',
      content: 'Приготовьтесь к самым крутым баттлам этого года. Призовой фонд 100,000 рублей!',
      category: 'battle',
      author: 'EventManager',
      timestamp: '1 час назад'
    },
    {
      id: '3',
      title: 'Новое обновление приложения',
      content: 'Добавлены новые функции: карта спотов, система достижений и многое другое.',
      category: 'news',
      author: 'Developer',
      timestamp: '30 минут назад'
    }
  ]);

  const handleCreatePost = (newPost: { title: string; content: string; category: string }) => {
    const post = {
      id: Date.now().toString(),
      ...newPost,
      author: user?.username || user?.telegram_username || 'Пользователь',
      timestamp: 'только что'
    };
    
    setPosts(prev => [post, ...prev]);
  };

  return (
    <div className="pb-16">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
        <h1 className="text-xl font-bold">RollTricks</h1>
        <p className="text-blue-100 text-sm">Сообщество роллеров</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 m-2">
          <TabsTrigger value="general" className="text-xs">Общее</TabsTrigger>
          <TabsTrigger value="battle" className="text-xs">Battle</TabsTrigger>
          <TabsTrigger value="news" className="text-xs">Новости</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="m-0">
          <CategoryFeed
            category="general"
            title="Общие посты"
            posts={posts}
            onCreatePost={handleCreatePost}
          />
        </TabsContent>
        
        <TabsContent value="battle" className="m-0">
          <CategoryFeed
            category="battle"
            title="Видео батлы"
            posts={posts}
            onCreatePost={handleCreatePost}
            onUploadVideo={onNavigateToUpload}
          />
        </TabsContent>
        
        <TabsContent value="news" className="m-0">
          <CategoryFeed
            category="news"
            title="Новости"
            posts={posts}
            onCreatePost={handleCreatePost}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewVideoFeed;
