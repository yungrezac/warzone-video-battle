
import React from 'react';
import { Trophy, Coins } from 'lucide-react';

interface HeaderProps {
  userBalance: number;
  userName: string;
}

const Header: React.FC<HeaderProps> = ({ userBalance, userName }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">WZ Battle</h1>
            <p className="text-sm opacity-90">Привет, {userName}!</p>
          </div>
        </div>
        
        <div className="flex items-center bg-white bg-opacity-20 rounded-full px-3 py-2">
          <Coins className="w-5 h-5 mr-2" />
          <span className="font-bold">{userBalance}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
