
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/AuthWrapper';
import CategoryFeed from './CategoryFeed';
import { useCommunityPosts, useCreatePost } from '@/hooks/useCommunityPosts';

interface NewVideoFeedProps {
  onNavigateToUpload?: () => void;
}

const NewVideoFeed: React.FC<NewVideoFeedProps> = ({ onNavigateToUpload }) => {
  const { user } = useAuth();
  const { data: posts } = useCommunityPosts();
  const createPost = useCreatePost();

  const handleCreatePost = async (newPost: { title: string; content: string; category: string }) => {
    try {
      await createPost.mutateAsync({
        title: newPost.title,
        content: newPost.content,
        category: newPost.category as 'general' | 'battle' | 'news',
      });
    } catch (error) {
      console.error('Ошибка создания поста:', error);
    }
  };

  // Преобразуем посты в формат, ожидаемый CategoryFeed
  const formattedPosts = (posts || []).map(post => ({
    id: post.id,
    title: post.title,
    content: post.content || '',
    category: post.category,
    author: post.user?.username || post.user?.telegram_username || 'Пользователь',
    timestamp: new Date(post.created_at).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }));

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
            posts={formattedPosts}
            onCreatePost={handleCreatePost}
          />
        </TabsContent>
        
        <TabsContent value="battle" className="m-0">
          <CategoryFeed
            category="battle"
            title="Видео батлы"
            posts={formattedPosts}
            onCreatePost={handleCreatePost}
            onUploadVideo={onNavigateToUpload}
          />
        </TabsContent>
        
        <TabsContent value="news" className="m-0">
          <CategoryFeed
            category="news"
            title="Новости"
            posts={formattedPosts}
            onCreatePost={handleCreatePost}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewVideoFeed;
