
import React, { useState } from 'react';
import { Comment, useAddVideoComment, useLikeVideoComment } from '@/hooks/useVideoComments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, MessageSquare, Send, Loader2 } from 'lucide-react';
import { useAuth } from './AuthWrapper';
import { toast } from 'sonner';

interface CommentItemProps {
  comment: Comment;
  videoId: string;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, videoId, isReply = false }) => {
    const { user } = useAuth();
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [localIsLiked, setLocalIsLiked] = useState(comment.user_liked);
    const [localLikesCount, setLocalLikesCount] = useState(comment.likes_count);

    const likeCommentMutation = useLikeVideoComment();
    const addCommentMutation = useAddVideoComment();

    const handleLike = () => {
        if (!user) {
            toast.error("Войдите в систему, чтобы ставить лайки");
            return;
        }

        const newLikedState = !localIsLiked;
        setLocalIsLiked(newLikedState);
        setLocalLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

        likeCommentMutation.mutate({ commentId: comment.id, videoId, isLiked: comment.user_liked });
    };

    const handleReplySubmit = () => {
        if (!user) {
            toast.error("Войдите в систему, чтобы отвечать на комментарии");
            return;
        }
        if (!replyContent.trim()) {
            toast.error("Введите текст ответа");
            return;
        }
        addCommentMutation.mutate({
            videoId,
            content: replyContent,
            parentCommentId: comment.id,
        }, {
            onSuccess: () => {
                setReplyContent('');
                setShowReplyForm(false);
                toast.success("Ответ добавлен");
            },
            onError: () => toast.error("Ошибка при добавлении ответа")
        });
    };
    
    return (
        <div className="flex space-x-3">
            <Avatar className="w-8 h-8">
                <AvatarImage src={comment.profiles?.avatar_url || undefined} alt={comment.profiles?.username || 'avatar'}/>
                <AvatarFallback>{comment.profiles?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="bg-gray-100 rounded-lg p-2.5">
                    <p className="font-semibold text-sm text-gray-800">{comment.profiles?.username || comment.profiles?.telegram_username || 'Пользователь'}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1.5 pl-1">
                    <button onClick={handleLike} disabled={likeCommentMutation.isPending} className={`flex items-center space-x-1 hover:text-blue-600 transition-colors ${localIsLiked ? 'text-blue-600 font-medium' : ''}`}>
                        <ThumbsUp size={14} className={localIsLiked ? 'fill-current' : ''} />
                        <span>{localLikesCount}</span>
                    </button>
                    <button onClick={() => setShowReplyForm(!showReplyForm)} className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                        <MessageSquare size={14} />
                        <span>Ответить</span>
                    </button>
                    <span className="text-gray-400">{new Date(comment.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {showReplyForm && (
                     <div className="mt-2.5 flex space-x-2">
                         <Textarea 
                             value={replyContent}
                             onChange={e => setReplyContent(e.target.value)}
                             placeholder={`Ответ ${comment.profiles?.username || 'пользователю'}...`}
                             className="flex-1 min-h-[40px] resize-none text-sm"
                             rows={1}
                         />
                         <Button onClick={handleReplySubmit} disabled={addCommentMutation.isPending} size="icon" className="h-auto px-3">
                             {addCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
                         </Button>
                     </div>
                )}
                
                {comment.replies && comment.replies.length > 0 && (
                    <div className={`mt-3 space-y-3 ${!isReply ? 'pl-11' : ''}`}>
                        {comment.replies.map(reply => (
                            <CommentItem key={reply.id} comment={reply} videoId={videoId} isReply={true} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentItem;
