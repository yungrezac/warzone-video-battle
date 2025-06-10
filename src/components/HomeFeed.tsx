
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TrendingUp, Video } from 'lucide-react';
import PostCreation from '@/components/PostCreation';
import VideoFeed from '@/components/VideoFeed';

const HomeFeed = () => {
  const [showPostCreation, setShowPostCreation] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const handlePostCreated = () => {
    setShowPostCreation(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sticky top-0 z-40 shadow-lg">
        <h1 className="text-xl font-bold">Главная</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/90 backdrop-blur-sm shadow-md border-0 h-12">
            <TabsTrigger 
              value="posts" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium"
            >
              Посты
            </TabsTrigger>
            <TabsTrigger 
              value="tricks" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium"
            >
              Трюки
            </TabsTrigger>
            <TabsTrigger 
              value="popular" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium"
            >
              Популярное
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            {/* Кнопка создания поста */}
            {!showPostCreation && (
              <Button
                onClick={() => setShowPostCreation(true)}
                className="w-full justify-start bg-white/90 backdrop-blur-sm text-gray-700 border-0 shadow-md hover:shadow-lg hover:bg-white transition-all h-14 rounded-xl"
                variant="outline"
              >
                <Plus className="w-5 h-5 mr-3" />
                <span className="font-medium">Создать пост</span>
              </Button>
            )}

            {/* Форма создания поста */}
            {showPostCreation && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-0">
                <PostCreation
                  onPostCreated={handlePostCreated}
                  onCancel={() => setShowPostCreation(false)}
                />
              </div>
            )}

            {/* Лента постов */}
            <div className="space-y-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md p-8 text-center border-0">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-gray-600 text-lg mb-2">Постов пока нет</p>
                <p className="text-gray-500">Будьте первым, кто поделится!</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tricks">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border-0 overflow-hidden">
              <VideoFeed />
            </div>
          </TabsContent>

          <TabsContent value="popular" className="space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md p-8 text-center border-0">
              <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-10 h-10 text-orange-600" />
              </div>
              <p className="text-gray-600 text-lg mb-2">Популярный контент появится здесь</p>
              <p className="text-gray-500">Когда появится больше активности</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HomeFeed;
