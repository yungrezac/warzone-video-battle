
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TrendingUp } from 'lucide-react';
import PostCreation from '@/components/PostCreation';
import VideoFeed from '@/components/VideoFeed';

const HomeFeed = () => {
  const [showPostCreation, setShowPostCreation] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const handlePostCreated = () => {
    setShowPostCreation(false);
    // Здесь можно обновить ленту постов
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sticky top-0 z-40">
        <h1 className="text-lg font-bold">Главная</h1>
      </div>

      {/* Content */}
      <div className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="posts">Посты</TabsTrigger>
            <TabsTrigger value="tricks">Трюки</TabsTrigger>
            <TabsTrigger value="popular">Популярное</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {/* Кнопка создания поста */}
            {!showPostCreation && (
              <Button
                onClick={() => setShowPostCreation(true)}
                className="w-full justify-start"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать пост
              </Button>
            )}

            {/* Форма создания поста */}
            {showPostCreation && (
              <PostCreation
                onPostCreated={handlePostCreated}
                onCancel={() => setShowPostCreation(false)}
              />
            )}

            {/* Лента постов */}
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <p>Постов пока нет</p>
                <p className="text-sm">Будьте первым, кто поделится!</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tricks">
            <VideoFeed />
          </TabsContent>

          <TabsContent value="popular" className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Популярный контент появится здесь</p>
              <p className="text-sm">Когда появится больше активности</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HomeFeed;
