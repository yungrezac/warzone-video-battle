
import React, { useState } from 'react';
import { Home, Map, MoreHorizontal, Users, MessageSquare, User } from 'lucide-react';
import ExtraMenuDrawer from './ExtraMenuDrawer';

interface NewBottomNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NewBottomNavbar: React.FC<NewBottomNavbarProps> = ({ activeTab, onTabChange }) => {
  const [showExtraMenu, setShowExtraMenu] = useState(false);

  const tabs = [
    { id: 'home', icon: Home, label: 'Главная' },
    { id: 'map', icon: Map, label: 'Карта' },
    { id: 'extra', icon: MoreHorizontal, label: 'Ещё', isExtra: true },
    { id: 'users', icon: Users, label: 'Пользователи' },
    { id: 'community', icon: MessageSquare, label: 'Сообщества' },
    { id: 'profile', icon: User, label: 'Профиль' },
  ];

  const handleTabClick = (tab: any) => {
    if (tab.isExtra) {
      setShowExtraMenu(true);
    } else {
      onTabChange(tab.id);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-1 py-1 z-30">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`flex flex-col items-center py-1 px-1 rounded-lg transition-colors ${
                  isActive && !tab.isExtra
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ExtraMenuDrawer
        isOpen={showExtraMenu}
        onClose={() => setShowExtraMenu(false)}
        onNavigate={onTabChange}
      />
    </>
  );
};

export default NewBottomNavbar;
