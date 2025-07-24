
import React from 'react';
import { Home, User, ShoppingBag, Trophy, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BottomNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  const tabs = [
    { id: 'home', icon: Home, label: t('navbar_home') },
    { id: 'top', icon: Trophy, label: t('navbar_top') },
    { id: 'tournaments', icon: Zap, label: t('navbar_tournaments') },
    { id: 'market', icon: ShoppingBag, label: t('navbar_market') },
    { id: 'profile', icon: User, label: t('navbar_profile') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-30">
      <div className="flex justify-around items-center">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
              activeTab === id
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavbar;
