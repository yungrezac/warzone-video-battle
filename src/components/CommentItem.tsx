
import React, { useState } from 'react';
import { Comment, useLikeVideoComment } from '@/hooks/useVideoComments';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, MessageSquare } from 'lucide-react';
import { useAuth } from './AuthWrapper';
import { toast } from 'sonner';

interface CommentItemProps {
  comment: Comment;
  videoId: string;
  onReply: (comment: Comment) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, videoId, onReply }) => {
    const { user } = useAuth();
    const [localIsLiked, setLocalIsLiked] = useState(comment.user_liked);
    const [localLikesCount, setLocalLikesCount] = useState(comment.likes_count);

    const likeCommentMutation = useLikeVideoComment();

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

    const handleReplyClick = () => {
        if (!user) {
            toast.error("Войдите в систему, чтобы отвечать на комментарии");
            return;
        }
        onReply(comment);
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
                    {comment.parent_comment_author && (
                        <p className="text-sm text-blue-600 mb-1">
                            в ответ @{comment.parent_comment_author.username || comment.parent_comment_author.telegram_username}
                        </p>
                    )}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1.5 pl-1">
                    <button onClick={handleLike} disabled={likeCommentMutation.isPending} className={`flex items-center space-x-1 hover:text-blue-600 transition-colors ${localIsLiked ? 'text-blue-600 font-medium' : ''}`}>
                        <ThumbsUp size={14} className={localIsLiked ? 'fill-current' : ''} />
                        <span>{localLikesCount}</span>
                    </button>
                    <button onClick={handleReplyClick} className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                        <MessageSquare size={14} />
                        <span>Ответить</span>
                    </button>
                    <span className="text-gray-400">{new Date(comment.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        </div>
    );
};

export default CommentItem;
