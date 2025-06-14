import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wifi, WifiOff } from 'lucide-react';
import TournamentBannerCarousel from './TournamentBannerCarousel';
import { Button } from './ui/button';
import TournamentDetailsModal from './TournamentDetailsModal';
const Tournaments: React.FC = () => {
  const [modalType, setModalType] = useState<'online' | 'offline' | null>(null);
  const renderContent = (type: 'online' | 'offline') => <div className="text-center p-8 border-2 border-dashed rounded-xl bg-gray-50">
      <p className="text-gray-500 mb-4">Пока нет турниров</p>
      <Button onClick={() => setModalType(type)}>
        Подробнее
      </Button>
    </div>;
  return <>
      <div className="pb-16 p-4 px-[10px] py-[10px]">
        <TournamentBannerCarousel />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 px-[4px]">Турниры</h1>
          
        </div>

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

          <TabsContent value="online">
            {renderContent('online')}
          </TabsContent>

          <TabsContent value="offline">
            {renderContent('offline')}
          </TabsContent>
        </Tabs>
      </div>
      <TournamentDetailsModal isOpen={modalType !== null} onClose={() => setModalType(null)} type={modalType} />
    </>;
};
export default Tournaments;