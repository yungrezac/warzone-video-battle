
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Gift, Clock, MapPin, Wifi, WifiOff, Zap } from 'lucide-react';
import TournamentBannerCarousel from './TournamentBannerCarousel';

const Tournaments: React.FC = () => {
  return (
    <div className="pb-16 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Турниры</h1>
        <p className="text-gray-600 text-sm">Соревнования по роллерам, BMX и скейтбордингу</p>
      </div>

      <TournamentBannerCarousel />

      <Tabs defaultValue="online" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="online" className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Онлайн
          </TabsTrigger>
          <TabsTrigger value="offline" className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            Офлайн
          </TabsTrigger>
        </TabsList>

        <TabsContent value="online" className="space-y-4">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white text-center">
            <Zap className="w-12 h-12 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Онлайн Турниры</h3>
            <p className="text-purple-100 mb-4">
              Соревнования по роллерам, BMX и скейтборду со всего мира
            </p>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="w-5 h-5" />
                <span className="font-bold text-lg">Призовой фонд</span>
              </div>
              <div className="text-2xl font-bold">от 50.000₽</div>
            </div>
            <div className="flex items-center justify-center gap-2 text-purple-100">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Скоро начнем!</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Категории соревнований:</h4>
            <div className="grid grid-cols-1 gap-3 mb-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🛼</span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">Роллеры</div>
                  <div className="text-xs text-gray-600">Фристайл, слалом, агрессив</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🚴</span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">BMX</div>
                  <div className="text-xs text-gray-600">Стрит, парк, флэтленд</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🛹</span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">Скейтборд</div>
                  <div className="text-xs text-gray-600">Стрит, верт, трик</div>
                </div>
              </div>
            </div>
            <h4 className="font-semibold text-gray-800 mb-3">Как участвовать:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                <span>Загружайте видео с лучшими трюками</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                <span>Получайте голоса от сообщества</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                <span>Побеждайте в своей категории</span>
              </li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="offline" className="space-y-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white text-center">
            <MapPin className="w-12 h-12 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Офлайн Турниры</h3>
            <p className="text-orange-100 mb-4">
              Живые соревнования по роллерам, BMX и скейтборду в городах России
            </p>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="w-5 h-5" />
                <span className="font-bold text-lg">Призовой фонд</span>
              </div>
              <div className="text-2xl font-bold">от 50.000₽</div>
            </div>
            <div className="flex items-center justify-center gap-2 text-orange-100">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Скоро начнем!</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Планируемые города:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>Москва</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>СПб</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>Казань</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>Екб</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Что включено:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>Профессиональное судейство по всем дисциплинам</span>
              </li>
              <li className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-blue-500" />
                <span>Призы от ведущих брендов экипировки</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <span>Лучшие спот-локации городов</span>
              </li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tournaments;
