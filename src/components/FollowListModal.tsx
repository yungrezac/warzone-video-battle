
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFollowList } from '@/hooks/useFollowList';
import { Loader2, Users } from 'lucide-react';
import FollowListItem from './FollowListItem';
import { useTranslation } from 'react-i18next';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  listType: 'followers' | 'following';
  onUserSelect: (userId: string) => void;
}

const FollowListModal: React.FC<FollowListModalProps> = ({ isOpen, onClose, userId, listType, onUserSelect }) => {
  const { data: users, isLoading, error } = useFollowList(userId, listType);
  const { t } = useTranslation();

  const title = listType === 'followers' ? t('followers') : t('following');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {title} ({users?.length || 0})
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto -mr-4 pr-4">
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          {error && <p className="text-red-500 text-sm text-center">{t('list_load_error')}</p>}
          {users && users.length > 0 && (
            <div className="space-y-1">
              {users.map(user => (
                <FollowListItem
                  key={user.id}
                  user={user}
                  onUserClick={onClose}
                  onUserSelect={onUserSelect}
                />
              ))}
            </div>
          )}
          {users && users.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">
              {listType === 'followers' ? t('no_followers') : t('no_following')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowListModal;
