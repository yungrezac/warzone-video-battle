
import React from 'react';
import { ShoppingBag, Star, Gift, Crown } from 'lucide-react';

const Market: React.FC = () => {
  return (
    <div className="p-4 pb-20">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg mb-6">
        <div className="flex items-center mb-4">
          <ShoppingBag className="w-8 h-8 mr-3" />
          <h2 className="text-2xl font-bold">Маркет</h2>
        </div>
        <p className="opacity-90">Тратьте заработанные баллы на крутые награды!</p>
      </div>

      <div className="text-center py-16">
        <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <Gift className="w-12 h-12 text-gray-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          Скоро тут можно будет потратить баллы
        </h3>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Мы готовим для вас удивительные награды! Продолжайте участвовать в соревнованиях и копить баллы.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Премиум статус</p>
            <p className="text-xs text-gray-500">Скоро</p>
          </div>
          
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Crown className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Эксклюзивные бейджи</p>
            <p className="text-xs text-gray-500">Скоро</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Market;
