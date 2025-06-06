
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PostCreator from './PostCreator';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  timestamp: string;
}

interface CategoryFeedProps {
  category: 'general' | 'battle' | 'news';
  title: string;
  posts: Post[];
  onCreatePost: (post: { title: string; content: string; category: string }) => void;
}

const CategoryFeed: React.FC<CategoryFeedProps> = ({ category, title, posts, onCreatePost }) => {
  const [showCreator, setShowCreator] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between p-3 bg-white border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
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
          category={category}
          onClose={() => setShowCreator(false)}
          onSubmit={onCreatePost}
        />
      )}

      <div className="p-2 space-y-2">
        {posts.filter(post => post.category === category).map(post => (
          <Card key={post.id} className="p-3">
            <h3 className="font-semibold text-sm mb-1">{post.title}</h3>
            {post.content && (
              <p className="text-gray-600 text-sm mb-2">{post.content}</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>@{post.author}</span>
              <span>{post.timestamp}</span>
            </div>
          </Card>
        ))}
        
        {posts.filter(post => post.category === category).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Пока нет постов в этой категории</p>
            <p className="text-xs">Будьте первым, кто создаст пост!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryFeed;
