
import React from 'react';
import { Button } from '@/components/ui/button';
import { useUpdateAchievementProgress } from '@/hooks/useAchievements';
import { toast } from 'sonner';

const AchievementTestButton: React.FC = () => {
  const updateProgress = useUpdateAchievementProgress();

  const testAchievement = async () => {
    try {
      // Симулируем получение лайка
      await updateProgress.mutateAsync({
        category: 'likes',
        increment: 1
      });
      
      toast.success('Тестовый прогресс достижения обновлен!');
    } catch (error) {
      console.error('Ошибка при тестировании достижения:', error);
      toast.error('Ошибка при обновлении достижения');
    }
  };

  return (
    <Button 
      onClick={testAchievement}
      variant="outline"
      size="sm"
      disabled={updateProgress.isPending}
      className="fixed bottom-20 right-4 z-40 bg-yellow-500 hover:bg-yellow-600 text-white"
    >
      🏆 Тест достижения
    </Button>
  );
};

export default AchievementTestButton;
