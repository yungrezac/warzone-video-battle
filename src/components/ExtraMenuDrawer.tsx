
import React from 'react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  ShoppingBag, 
  Settings, 
  HelpCircle,
  Star,
  Bell,
  Share2
} from 'lucide-react';

interface ExtraMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

const ExtraMenuDrawer: React.FC<ExtraMenuDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const menuItems = [
    { id: 'market', icon: ShoppingBag, label: 'Магазин', color: 'text-green-600' },
    { id: 'settings', icon: Settings, label: 'Настройки', color: 'text-gray-600' },
    { id: 'help', icon: HelpCircle, label: 'Помощь', color: 'text-purple-600' },
    { id: 'premium', icon: Star, label: 'Premium', color: 'text-yellow-600' },
    { id: 'notifications', icon: Bell, label: 'Уведомления', color: 'text-red-600' },
    { id: 'share', icon: Share2, label: 'Поделиться', color: 'text-indigo-600' },
  ];

  const handleItemClick = (itemId: string) => {
    onNavigate(itemId);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[40vh]">
        <DrawerHeader>
          <DrawerTitle className="text-center">Дополнительные функции</DrawerTitle>
        </DrawerHeader>
        <div className="grid grid-cols-2 gap-3 p-4">
          {menuItems.map(({ id, icon: Icon, label, color }) => (
            <Button
              key={id}
              variant="ghost"
              onClick={() => handleItemClick(id)}
              className="h-16 flex flex-col items-center justify-center space-y-1 hover:bg-gray-50"
            >
              <Icon className={`w-6 h-6 ${color}`} />
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </Button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ExtraMenuDrawer;
