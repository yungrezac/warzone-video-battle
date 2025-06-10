
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { usePointsHistory } from '@/hooks/usePointsHistory';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface PointsHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PointsHistoryDialog: React.FC<PointsHistoryDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { data: history, isLoading } = usePointsHistory();

  const getOperationTypeText = (type: string) => {
    switch (type) {
      case 'earned':
        return 'Начислено';
      case 'spent':
        return 'Потрачено';
      case 'withdrawal':
        return 'Вывод';
      case 'refund':
        return 'Возврат';
      default:
        return type;
    }
  };

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case 'earned':
        return 'bg-green-100 text-green-800';
      case 'spent':
        return 'bg-red-100 text-red-800';
      case 'withdrawal':
        return 'bg-yellow-100 text-yellow-800';
      case 'refund':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>История баллов</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Загрузка...</div>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">История пуста</div>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getOperationTypeColor(item.operation_type)}>
                        {getOperationTypeText(item.operation_type)}
                      </Badge>
                      <span
                        className={`font-semibold ${
                          item.points_change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {item.points_change > 0 ? '+' : ''}{item.points_change}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(item.created_at), 'dd MMM yyyy, HH:mm', {
                        locale: ru,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
