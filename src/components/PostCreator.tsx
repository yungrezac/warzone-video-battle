
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { X, Plus, Image, Video } from 'lucide-react';

interface PostCreatorProps {
  category: 'general' | 'battle' | 'news';
  onClose: () => void;
  onSubmit: (post: { title: string; content: string; category: string }) => void;
}

const PostCreator: React.FC<PostCreatorProps> = ({ category, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const getCategoryTitle = () => {
    switch (category) {
      case 'general': return 'Общий пост';
      case 'battle': return 'Battle пост';
      case 'news': return 'Новость';
      default: return 'Пост';
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    onSubmit({
      title: title.trim(),
      content: content.trim(),
      category
    });
    
    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <Card className="p-4 m-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{getCategoryTitle()}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="Заголовок поста..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        <Textarea
          placeholder="Содержание поста..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Image className="w-4 h-4 mr-2" />
            Фото
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Video className="w-4 h-4 mr-2" />
            Видео
          </Button>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={!title.trim()}
          className="w-full"
        >
          Опубликовать
        </Button>
      </div>
    </Card>
  );
};

export default PostCreator;
