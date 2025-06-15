
import React, { useState } from 'react';
import { Comment, useLikeVideoComment, useDeleteVideoComment } from '@/hooks/useVideoComments';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from './AuthWrapper';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CommentItemProps {
  comment: Comment;
  videoId: string;
  onReply: (comment: Comment) => void;
  onViewProfile: (userId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, videoId, onReply, onViewProfile }) => {
    const { user } = useAuth();
    const [localIsLiked, setLocalIsLiked] = useState(comment.user_liked);
    const [localLikesCount, setLocalLikesCount] = useState(comment.likes_count);

    const likeCommentMutation = useLikeVideoComment();
    const deleteCommentMutation = useDeleteVideoComment();

    const handleLike = () => {
        if (!user) {
            toast.error("Войдите в систему, чтобы ставить лайки");
            return;
        }

        const currentLikedState = localIsLiked;
        const newLikedState = !currentLikedState;

        setLocalIsLiked(newLikedState);
        setLocalLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

        likeCommentMutation.mutate({ commentId: comment.id, videoId, isLiked: currentLikedState });
    };

    const handleReplyClick = () => {
        if (!user) {
            toast.error("Войдите в систему, чтобы отвечать на комментарии");
            return;
        }
        onReply(comment);
    };

    const handleDelete = async () => {
        try {
            await deleteCommentMutation.mutateAsync({ commentId: comment.id, videoId });
            toast.success("Комментарий удален");
        } catch (error) {
            toast.error("Ошибка при удалении комментария");
            console.error("Ошибка удаления комментария:", error);
        }
    };
    
    return (
        <div className="flex space-x-3">
            <button
              onClick={() => comment.user_id && onViewProfile(comment.user_id)}
              disabled={!comment.user_id}
              className="flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:cursor-default"
            >
              <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.profiles?.avatar_url || undefined} alt={comment.profiles?.username || 'avatar'}/>
                  <AvatarFallback>{comment.profiles?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </button>
            <div className="flex-1">
                <div className="bg-gray-100 rounded-lg p-2.5">
                    <p className="font-semibold text-sm text-gray-800">{comment.profiles?.username || comment.profiles?.telegram_username || 'Пользователь'}</p>
                    {comment.parent_comment_author && comment.parent_comment_content && (
                        <p className="text-xs text-gray-500 mb-1 mt-1">
                            в ответ <span className="font-medium text-blue-600">@{comment.parent_comment_author.username || comment.parent_comment_author.telegram_username}</span>: <span className="italic">"{comment.parent_comment_content.length > 40 ? `${comment.parent_comment_content.substring(0, 40)}...` : comment.parent_comment_content}"</span>
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
                    {user?.id === comment.user_id && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button disabled={deleteCommentMutation.isPending} className="flex items-center space-x-1 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50">
                                    <Trash2 size={14} />
                                    <span>Удалить</span>
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Это действие необратимо. Ваш комментарий будет удален навсегда.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                    {deleteCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Удалить"}
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <span className="text-gray-400 ml-auto">{new Date(comment.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        </div>
    );
};

export default CommentItem;
