
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Send, X } from 'lucide-react';
import { useVideoComments, useAddVideoComment, Comment } from '@/hooks/useVideoComments';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';
import CommentItem from './CommentItem';

interface VideoCommentsProps {
  videoId: string;
  commentsCount: number;
}

const VideoComments: React.FC<VideoCommentsProps> = ({ videoId, commentsCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  const { user } = useAuth();
  const { data: rootComments, isLoading } = useVideoComments(videoId);
  const addCommentMutation = useAddVideoComment();

  const totalComments = useMemo(() => {
    if (isLoading || !rootComments) return commentsCount;
    let count = 0;
    const countComments = (comments: Comment[]) => {
        for (const comment of comments) {
            count++;
            if (comment.replies) {
                countComments(comment.replies);
            }
        }
    }
    countComments(rootComments);
    return count;
  }, [rootComments, commentsCount, isLoading]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error('Введите текст комментария');
      return;
    }
    
    if (!user) {
      toast.error('Войдите в систему, чтобы оставлять комментарии');
      return;
    }
    
    try {
      await addCommentMutation.mutateAsync({
        videoId,
        content: newComment.trim(),
      });
      setNewComment('');
      toast.success('Комментарий добавлен');
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
          className="text-gray-600 hover:text-blue-500 h-7 px-1.5"
        >
          <MessageCircle className="w-3.5 h-3.5 mr-1" />
          <span className="text-xs">{totalComments}</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className="w-screen h-screen max-w-none max-h-none m-0 rounded-none p-0 flex flex-col"
        hideCloseButton={true}
      >
        <DialogHeader className="p-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <DialogTitle>Комментарии ({totalComments})</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : rootComments && rootComments.length > 0 ? (
             rootComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} videoId={videoId} />
            ))
          ) : (
            <div className="text-center py-16 text-gray-500">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Пока нет комментариев</p>
              <p className="text-sm">Будьте первым!</p>
            </div>
          )}
        </div>
        
        {user ? (
          <div className="border-t bg-white p-4">
            <div className="flex space-x-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Напишите комментарий..."
                className="flex-1 min-h-[60px] resize-none"
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
                className="self-end"
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
          <div className="border-t bg-white p-4 text-center text-gray-500">
            <p>Войдите в систему, чтобы оставить комментарий</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoComments;
