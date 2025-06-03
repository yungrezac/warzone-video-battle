
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Send, User } from 'lucide-react';
import { useVideoComments, useAddComment } from '@/hooks/useVideoComments';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';

interface VideoCommentsProps {
  videoId: string;
  commentsCount: number;
}

const VideoComments: React.FC<VideoCommentsProps> = ({ videoId, commentsCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  const { user } = useAuth();
  const { data: comments, isLoading } = useVideoComments(videoId);
  const addCommentMutation = useAddComment();

  console.log('VideoComments рендер:', { videoId, commentsCount, comments, isLoading, user: user?.id });

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error('Введите текст комментария');
      return;
    }
    
    if (!user) {
      toast.error('Войдите в систему, чтобы оставлять комментарии');
      return;
    }
    
    console.log('Отправляем комментарий:', { videoId, content: newComment.trim() });
    
    try {
      await addCommentMutation.mutateAsync({
        videoId,
        content: newComment.trim(),
      });
      setNewComment('');
      toast.success('Комментарий добавлен');
      console.log('Комментарий успешно отправлен');
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
      toast.error('Ошибка добавления комментария');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-blue-500"
        >
          <MessageCircle className="w-5 h-5 mr-1" />
          {comments?.length || commentsCount}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Комментарии ({comments?.length || commentsCount})</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                    {comment.user?.avatar_url ? (
                      <img 
                        src={comment.user.avatar_url} 
                        alt="Avatar" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {comment.user?.username || comment.user?.telegram_username || 'Пользователь'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Пока нет комментариев</p>
              <p className="text-sm">Будьте первым!</p>
            </div>
          )}
        </div>
        
        {user ? (
          <div className="border-t pt-4 mt-4">
            <div className="flex space-x-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Напишите комментарий..."
                className="flex-1 min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
                size="sm"
              >
                {addCommentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Нажмите Enter для отправки, Shift+Enter для новой строки
            </p>
          </div>
        ) : (
          <div className="border-t pt-4 mt-4 text-center text-gray-500">
            <p>Войдите в систему, чтобы оставить комментарий</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoComments;
