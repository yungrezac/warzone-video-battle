
import React from 'react';
import { User, Crown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthWrapper';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import PremiumBadge from './PremiumBadge';
import SubscriptionModal from './SubscriptionModal';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { isPremium } = useSubscription();
  const { webApp, colorScheme } = useTelegramWebApp();

  // Адаптируемся к теме Telegram
  const isDark = colorScheme === 'dark';
  const headerClass = isDark 
    ? 'bg-gray-800 border-gray-700 text-white' 
    : 'bg-white border-gray-200 text-gray-900';

  if (!user) return null;

  return (
    <header className={`sticky top-0 z-50 border-b ${headerClass} backdrop-blur-md bg-opacity-90`}>
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Логотип и название */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TR</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">TRICKS</h1>
              {isPremium && (
                <PremiumBadge size="sm" />
              )}
            </div>
          </div>

          {/* Профиль пользователя */}
          <div className="flex items-center gap-3">
            {/* Баллы */}
            <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              <span>⭐</span>
              <span>{userProfile?.total_points || 0}</span>
            </div>

            {/* Кнопка Premium */}
            {!isPremium && (
              <SubscriptionModal>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                >
                  <Crown className="w-4 h-4 mr-1" />
                  Premium
                </Button>
              </SubscriptionModal>
            )}

            {/* Аватар */}
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage 
                  src={userProfile?.avatar_url || user.avatar_url} 
                  alt={userProfile?.first_name || user.first_name} 
                />
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              
              {/* Имя пользователя - скрываем на мобильных */}
              <div className="hidden sm:block">
                <div className="text-sm font-medium">
                  {userProfile?.first_name || user.first_name}
                  {isPremium && <Crown className="w-3 h-3 text-yellow-500 inline ml-1" />}
                </div>
              </div>
            </div>

            {/* Настройки */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (webApp) {
                  webApp.showPopup({
                    title: 'Настройки',
                    message: 'Настройки профиля доступны в разделе "Профиль"',
                    buttons: [{ type: 'ok' }]
                  });
                }
              }}
              className="p-2"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
