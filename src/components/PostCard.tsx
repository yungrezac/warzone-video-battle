
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';

interface Post {
  id: string;
  content: string;
  author: string;
  authorAvatar: string;
  mediaUrls: string[];
  likes: number;
  comments: number;
  timestamp: string;
  userLiked?: boolean;
  userId?: string;
}

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike }) => {
  const [localUserLiked, setLocalUserLiked] = useState(post.userLiked || false);
  const location = useLocation();

  // Синхронизируем локальное состояние с props при каждом изменении
  useEffect(() => {
    console.log('🔄 PostCard синхронизация состояния для поста:', {
      postId: post.id,
      userLiked: post.userLiked,
      previousLocalUserLiked: localUserLiked
    });
    
    if (post.userLiked !== localUserLiked) {
      console.log('📝 Обновляем localUserLiked с', localUserLiked, 'на', post.userLiked);
      setLocalUserLiked(post.userLiked || false);
    }
  }, [post.userLiked, post.id]);

  const handleLike = () => {
    console.log('💖 PostCard handleLike вызван для поста:', {
      postId: post.id,
      currentLocalUserLiked: localUserLiked,
      propsUserLiked: post.userLiked
    });
    
    // Мгновенно обновляем локальное состояние для лучшего UX
    const newLikedState = !localUserLiked;
    setLocalUserLiked(newLikedState);
    console.log('✨ Мгновенно изменили localUserLiked на:', newLikedState);
    
    // Вызываем родительский обработчик
    onLike(post.id);
  };

  // Не показываем ссылку если уже находимся на странице профиля этого пользователя
  const isOnUserProfile = location.pathname === `/user/${post.userId}`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center flex-1 min-w-0">
            {post.userId && !isOnUserProfile ? (
              <Link to={`/user/${post.userId}`} className="flex items-center flex-1 min-w-0 hover:opacity-80">
                <img 
                  src={post.authorAvatar} 
                  alt={post.author}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">@{post.author}</h3>
                  <p className="text-gray-500 text-xs">{post.timestamp}</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center flex-1 min-w-0">
                <img 
                  src={post.authorAvatar} 
                  alt={post.author}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">@{post.author}</h3>
                  <p className="text-gray-500 text-xs">{post.timestamp}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-3">
          <p className="text-gray-800">{post.content}</p>
        </div>

        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="mb-3">
            {post.mediaUrls.length === 1 ? (
              <img 
                src={post.mediaUrls[0]} 
                alt="Post media"
                className="w-full rounded-lg max-h-96 object-cover"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {post.mediaUrls.slice(0, 4).map((url, index) => (
                  <img 
                    key={index}
                    src={url} 
                    alt={`Post media ${index + 1}`}
                    className="w-full rounded-lg aspect-square object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`${localUserLiked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500 h-8 px-2`}
            >
              <Heart className={`w-4 h-4 mr-1 ${localUserLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{post.likes}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-blue-500 h-8 px-2"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">{post.comments}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
