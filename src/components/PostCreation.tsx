
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, MapPin, Route, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';

interface PostCreationProps {
  onPostCreated: () => void;
  onCancel: () => void;
}

const PostCreation: React.FC<PostCreationProps> = ({ onPostCreated, onCancel }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedSpot, setAttachedSpot] = useState<any>(null);
  const [attachedRoute, setAttachedRoute] = useState<any>(null);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Введите текст поста');
      return;
    }

    if (!user) {
      toast.error('Необходимо войти в систему');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          spot_id: attachedSpot?.id || null,
          route_id: attachedRoute?.id || null,
        });

      if (error) throw error;

      toast.success('Пост создан!');
      setContent('');
      setAttachedSpot(null);
      setAttachedRoute(null);
      onPostCreated();
    } catch (error) {
      console.error('Ошибка создания поста:', error);
      toast.error('Ошибка создания поста');
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Создать пост</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <Textarea
        placeholder="О чем хотите рассказать?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="mb-3"
        rows={3}
      />

      {/* Прикрепленные элементы */}
      {attachedSpot && (
        <div className="flex items-center p-2 bg-blue-50 rounded mb-2">
          <MapPin className="w-4 h-4 text-blue-600 mr-2" />
          <span className="text-sm">Спот: {attachedSpot.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAttachedSpot(null)}
            className="ml-auto"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {attachedRoute && (
        <div className="flex items-center p-2 bg-green-50 rounded mb-2">
          <Route className="w-4 h-4 text-green-600 mr-2" />
          <span className="text-sm">Маршрут: {attachedRoute.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAttachedRoute(null)}
            className="ml-auto"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Paperclip className="w-4 h-4 mr-1" />
            Медиа
          </Button>
          <Button variant="outline" size="sm">
            <MapPin className="w-4 h-4 mr-1" />
            Спот
          </Button>
          <Button variant="outline" size="sm">
            <Route className="w-4 h-4 mr-1" />
            Маршрут
          </Button>
        </div>
        
        <Button onClick={handleSubmit} disabled={isLoading || !content.trim()}>
          {isLoading ? 'Публикуем...' : 'Опубликовать'}
        </Button>
      </div>
    </div>
  );
};

export default PostCreation;
