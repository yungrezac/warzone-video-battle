
import React, { useState } from 'react';
import { Trophy, Coins, Settings, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationSettings from '@/components/NotificationSettings';
import ComingSoonModal from '@/components/ComingSoonModal';

interface HeaderProps {
  userBalance: number;
  userName: string;
}

const Header: React.FC<HeaderProps> = ({ userBalance, userName }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  return (
    <>
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 rounded-full p-1.5 mr-2">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold">RollTricks</h1>
              <p className="text-xs opacity-90">Привет, {userName}!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white bg-opacity-20 rounded-full px-2 py-1">
              <Coins className="w-4 h-4 mr-1" />
              <span className="font-bold text-sm">{userBalance}</span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 rounded-full"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 rounded-full"
              onClick={() => setIsWithdrawOpen(true)}
            >
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <NotificationSettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      
      <ComingSoonModal 
        isOpen={isWithdrawOpen} 
        onClose={() => setIsWithdrawOpen(false)} 
      />
    </>
  );
};

export default Header;
