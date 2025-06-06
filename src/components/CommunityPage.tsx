
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, MessageCircle, Heart, User } from 'lucide-react';
import { useCommunityPosts, useCreatePost } from '@/hooks/useCommunityPosts';
import { useAuth } from '@/components/AuthWrapper';
import PostCreator from './PostCreator';
import { useToast } from '@/hooks/use-toast';

const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const { data: allPosts, isLoading } = useCommunityPosts();
  const createPost = useCreatePost();
  const { toast } = useToast();
  const [showCreator, setShowCreator] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'general' | 'news'>('general');

  const handleCreatePost = async (postData: { title: string; content: string; category: string }) => {
    try {
      await createPost.mutateAsync({
        title: postData.title,
        content: postData.content,
        category: postData.category as 'general' | 'news',
      });
      setShowCreator(false);
      toast({
        title: "Успешно!",
        description: "Пост создан",
      });
    } catch (error) {
      console.error('Ошибка создания поста:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать пост",
        variant: "destructive",
      });
    }
  };

  const getPostsByCategory = (category: string) => {
    return allPosts?.filter(post => post.category === category) || [];
  };

  if (isLoading) {
    return (
      <div className="p-3 pb-16">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3">
        <h1 className="text-xl font-bold">Сообщество</h1>
        <p className="text-purple-100 text-sm">Общайтесь с другими роллерами</p>
      </div>

      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as 'general' | 'news')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 m-2">
          <TabsTrigger value="general" className="text-xs">Общение</TabsTrigger>
          <TabsTrigger value="news" className="text-xs">Новости</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="m-0">
          <div className="flex items-center justify-between p-3 bg-white border-b">
            <h2 className="text-lg font-semibold">Общие посты</h2>
            <Button 
              size="sm" 
              onClick={() => setShowCreator(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Создать
            </Button>
          </div>

          {showCreator && (
            <PostCreator
              category="general"
              onClose={() => setShowCreator(false)}
              onSubmit={handleCreatePost}
            />
          )}

          <div className="p-2 space-y-2">
            {getPostsByCategory('general').map(post => (
              <Card key={post.id} className="p-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">{post.title}</h3>
                    {post.content && (
                      <p className="text-gray-600 text-sm mb-2">{post.content}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>@{post.user?.username || post.user?.telegram_username || 'Роллер'}</span>
                      <span>{new Date(post.created_at).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Heart className="w-3 h-3" />
                        <span className="text-xs">{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <MessageCircle className="w-3 h-3" />
                        <span className="text-xs">{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            {getPostsByCategory('general').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Пока нет постов в этой категории</p>
                <p className="text-xs">Будьте первым, кто создаст пост!</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="news" className="m-0">
          <div className="flex items-center justify-between p-3 bg-white border-b">
            <h2 className="text-lg font-semibold">Новости</h2>
            <Button 
              size="sm" 
              onClick={() => setShowCreator(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Создать
            </Button>
          </div>

          <div className="p-2 space-y-2">
            {getPostsByCategory('news').map(post => (
              <Card key={post.id} className="p-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">{post.title}</h3>
                    {post.content && (
                      <p className="text-gray-600 text-sm mb-2">{post.content}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>@{post.user?.username || post.user?.telegram_username || 'Админ'}</span>
                      <span>{new Date(post.created_at).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Heart className="w-3 h-3" />
                        <span className="text-xs">{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <MessageCircle className="w-3 h-3" />
                        <span className="text-xs">{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            {getPostsByCategory('news').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Пока нет новостей</p>
                <p className="text-xs">Будьте первым, кто создаст новость!</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityPage;
