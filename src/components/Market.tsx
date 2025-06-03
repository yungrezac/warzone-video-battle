
import React from 'react';
import { ShoppingBag, Star, Gift, Crown, Zap, Settings } from 'lucide-react';

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

      <div className="text-center py-8">
        <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <Gift className="w-12 h-12 text-gray-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          Скоро тут можно будет потратить баллы
        </h3>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Мы готовим для вас удивительные награды! Продолжайте участвовать в соревнованиях и копить баллы.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
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

        {/* Новый раздел с роллерскими товарами */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-center mb-4">
            <Zap className="w-10 h-10 text-blue-500" />
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Роллерский магазин
          </h4>
          <p className="text-gray-600 mb-6 text-sm">
            Скоро появится возможность покупки роллерских товаров за накопленные баллы!
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Settings className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-xs font-medium text-gray-700">Запчасти</p>
              <p className="text-xs text-gray-500">Подшипники, тормоза</p>
            </div>
            
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
              <p className="text-xs font-medium text-gray-700">Колеса</p>
              <p className="text-xs text-gray-500">Разные размеры</p>
            </div>
            
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <div className="w-4 h-4 bg-purple-600 rounded"></div>
              </div>
              <p className="text-xs font-medium text-gray-700">Рамы</p>
              <p className="text-xs text-gray-500">Алюминий, карбон</p>
            </div>
            
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <div className="w-4 h-4 bg-red-600 rounded-lg"></div>
              </div>
              <p className="text-xs font-medium text-gray-700">Ролики</p>
              <p className="text-xs text-gray-500">Фрискейт, слалом</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Market;
