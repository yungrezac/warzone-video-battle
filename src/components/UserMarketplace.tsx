
import React, { useState } from 'react';
import { useUserMarketItems } from '@/hooks/useUserMarketItems';
import { useSubscription } from '@/hooks/useSubscription';
import UserMarketItemCard from './UserMarketItemCard';
import AddUserItemModal from './AddUserItemModal';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, ShoppingCart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const UserMarketplace: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState('all');
  const { data: items, isLoading } = useUserMarketItems({ target_audience: audienceFilter });
  const { isPremium } = useSubscription();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={audienceFilter} onValueChange={setAudienceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Фильтр" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="rollers">Роллеры</SelectItem>
            <SelectItem value="bmx">BMX</SelectItem>
            <SelectItem value="skate">Скейтборд</SelectItem>
          </SelectContent>
        </Select>

        {isPremium && (
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Добавить товар
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {items.map(item => (
            <UserMarketItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Здесь пока пусто</p>
          <p className="text-xs">Товары от других пользователей скоро появятся.</p>
        </div>
      )}

      {isPremium && (
        <AddUserItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

export default UserMarketplace;
