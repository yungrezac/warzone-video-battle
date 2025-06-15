
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { useAuth } from './AuthWrapper';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FollowListItem = ({ user, onUserClick }: { user: any, onUserClick: () => void }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isSubscribed, subscribe, unsubscribe, isLoading } = useUserSubscriptions(user.id);

  const handleFollowToggle = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };
  
  const handleUserClick = () => {
    onUserClick();
    navigate(`/user/${user.id}`);
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
      <div onClick={handleUserClick} className="flex items-center gap-3 cursor-pointer flex-1">
        <Avatar>
          <AvatarImage src={user.avatar_url} alt={user.username || t('skater')} />
          <AvatarFallback>{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <p className="font-semibold text-sm truncate">{user.username || user.telegram_username || t('skater')}</p>
          {user.first_name && user.last_name && (
            <p className="text-xs text-gray-500 truncate">{user.first_name} {user.last_name}</p>
          )}
        </div>
      </div>
      {currentUser?.id !== user.id && (
        <Button
          size="sm"
          variant={isSubscribed ? 'secondary' : 'outline'}
          onClick={handleFollowToggle}
          disabled={isLoading}
          className="flex-shrink-0"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isSubscribed ? t('unsubscribe') : t('subscribe')}
        </Button>
      )}
    </div>
  );
};

export default FollowListItem;
