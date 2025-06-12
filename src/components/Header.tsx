
import React, { useState } from 'react';
import { Search, Plus, Bell, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthWrapper';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PremiumBadge from './PremiumBadge';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionModal from './SubscriptionModal';

interface HeaderProps {
  onUploadClick?: () => void;
  activeTab?: string;
}

const Header: React.FC<HeaderProps> = ({ onUploadClick, activeTab }) => {
  const { user, signOut } = useAuth();
  const { isPremium } = useSubscription();
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const getTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Лента';
      case 'tournaments':
        return 'Турниры';
      case 'market':
        return 'Магазин';
      case 'profile':
        return 'Профиль';
      default:
        return 'RollersApp';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">
            {getTitle()}
          </h1>
          {isPremium && <PremiumBadge size="sm" />}
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'home' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchVisible(!isSearchVisible)}
              >
                <Search className="w-5 h-5" />
              </Button>
              
              {onUploadClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onUploadClick}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              )}
            </>
          )}

          <Button variant="ghost" size="sm">
            <Bell className="w-5 h-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isPremium && (
                <SubscriptionModal>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Получить Premium
                  </DropdownMenuItem>
                </SubscriptionModal>
              )}
              <DropdownMenuItem onClick={() => signOut()}>
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isSearchVisible && (
        <div className="px-4 pb-3">
          <Input
            placeholder="Поиск видео..."
            className="w-full"
          />
        </div>
      )}
    </header>
  );
};

export default Header;
