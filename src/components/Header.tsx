
import React from 'react';
import { Trophy, Coins } from 'lucide-react';

interface HeaderProps {
  userBalance: number;
  userName: string;
}

const Header: React.FC<HeaderProps> = ({ userBalance, userName }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sticky top-0 z-40">
      <div className="flex items-center justify-center">
        <div className="flex items-center">
          <div className="bg-white bg-opacity-20 rounded-full p-1.5 mr-2">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="mr-4">
            <h1 className="text-lg font-bold">RollTricks</h1>
            <p className="text-xs opacity-90">Привет, {userName}!</p>
          </div>
        </div>
        
        <div className="flex items-center bg-white bg-opacity-20 rounded-full px-2 py-1">
          <Coins className="w-4 h-4 mr-1" />
          <span className="font-bold text-sm">{userBalance}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
