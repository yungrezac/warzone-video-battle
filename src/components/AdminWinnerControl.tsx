
import React from 'react';
import { Crown, Loader2 } from 'lucide-react';
import { useCalculateWinner } from '@/hooks/useWinnerSystem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthWrapper';

interface AdminWinnerControlProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  videos: any[];
}

const AdminWinnerControl: React.FC<AdminWinnerControlProps> = ({
  isOpen,
  onClose,
  tournamentId,
  videos
}) => {
  const { user } = useAuth();
  const calculateWinnerMutation = useCalculateWinner();

  // Проверяем, является ли пользователь админом (TrickMaster)
  const isAdmin = user?.username === 'TrickMaster' || user?.telegram_username === 'TrickMaster';

  if (!isAdmin || !isOpen) {
    return null;
  }

  const handleCalculateWinner = async () => {
    try {
      await calculateWinnerMutation.mutateAsync();
      toast.success('Победитель дня успешно определен!');
      onClose();
    } catch (error) {
      console.error('Ошибка расчета победителя:', error);
      toast.error('Ошибка при определении победителя');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-yellow-700">
            <Crown className="w-5 h-5" />
            Админ панель
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-600 mb-3">
            Определить победителя вчерашнего дня
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleCalculateWinner}
              disabled={calculateWinnerMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-white flex-1"
            >
              {calculateWinnerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Определяем...
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Определить победителя
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
            >
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWinnerControl;
