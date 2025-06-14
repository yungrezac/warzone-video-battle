import React, { useState, useMemo, useRef } from 'react';
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
const VideoComments: React.FC<VideoCommentsProps> = ({
  videoId,
  commentsCount
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const {
    user
  } = useAuth();
  const {
    data: comments,
    isLoading
  } = useVideoComments(videoId);
  const addCommentMutation = useAddVideoComment();
  const totalComments = useMemo(() => {
    if (isLoading || !comments) return commentsCount;
    return comments.length;
  }, [comments, commentsCount, isLoading]);
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
        parentCommentId: replyTo?.id
      });
      setNewComment('');
      setReplyTo(null);
      toast.success(replyTo ? 'Ответ добавлен' : 'Комментарий добавлен');
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
      toast.error('Ошибка добавления комментария');
    }
  };
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-500 h-7 px-1.5">
          <MessageCircle className="w-3.5 h-3.5 mr-1" />
          <span className="text-xs">{totalComments}</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 rounded-none p-0 flex flex-col" hideCloseButton={true}>
        <DialogHeader className="p-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <DialogTitle>Комментарии ({totalComments})</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {isLoading ? <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div> : comments && comments.length > 0 ? comments.map(comment => <CommentItem key={comment.id} comment={comment} videoId={videoId} onReply={commentToReply => {
          setReplyTo(commentToReply);
          textAreaRef.current?.focus();
        }} />) : <div className="text-center py-16 text-gray-500">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Пока нет комментариев</p>
              <p className="text-sm">Будьте первым!</p>
            </div>}
        </div>
        
        {user ? <div className="border-t bg-white p-4">
            {replyTo && <div className="text-sm text-gray-500 mb-2 flex justify-between items-center bg-gray-100 p-2 rounded-md">
                <span>
                  Ответ пользователю: <span className="font-medium text-gray-800">@{replyTo.profiles?.username || replyTo.profiles?.telegram_username}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)} className="h-6 px-1.5 text-xs">
                  <X className="w-3.5 h-3.5 mr-1" />
                  Отменить
                </Button>
              </div>}
            <div className="flex items-end space-x-3">
              <Textarea ref={textAreaRef} value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Напишите комментарий..." className="flex-1 min-h-[40px] resize-none" onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmitComment();
            }
          }} />
              <Button size="icon" onClick={handleSubmitComment} disabled={!newComment.trim() || addCommentMutation.isPending}>
                {addCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            
          </div> : <div className="border-t bg-white p-4 text-center text-gray-500">
            <p>Войдите в систему, чтобы оставить комментарий</p>
          </div>}
      </DialogContent>
    </Dialog>;
};
export default VideoComments;
