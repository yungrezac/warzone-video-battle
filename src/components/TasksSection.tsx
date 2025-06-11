
import React from 'react';
import { Loader2, Target, Trophy } from 'lucide-react';
import { useTasks, useUserTasks, useCompleteTask } from '@/hooks/useTasks';
import { useAuth } from '@/components/AuthWrapper';
import TaskCard from './TaskCard';
import { toast } from 'sonner';

const TasksSection: React.FC = () => {
  const { user } = useAuth();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: userTasks, isLoading: userTasksLoading } = useUserTasks();
  const completeTaskMutation = useCompleteTask();

  const handleCompleteTask = async (taskId: string) => {
    if (!user) {
      toast.error('Войдите в систему для выполнения заданий');
      return;
    }

    try {
      const result = await completeTaskMutation.mutateAsync(taskId);
      toast.success(`Задание выполнено! Получено ${result.points_awarded} баллов`);
    } catch (error) {
      console.error('Ошибка выполнения задания:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Ошибка при выполнении задания');
      }
    }
  };

  if (tasksLoading || userTasksLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-3 mb-3">
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    );
  }

  const completedTaskIds = new Set(userTasks?.map(ut => ut.task_id) || []);
  const availableTasks = tasks?.filter(task => !completedTaskIds.has(task.id)) || [];
  const completedCount = userTasks?.length || 0;
  const totalTasks = tasks?.length || 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-3 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold flex items-center">
          <Target className="w-4 h-4 mr-2 text-blue-500" />
          Задания
        </h3>
        <div className="flex items-center text-sm text-gray-600">
          <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
          {completedCount}/{totalTasks}
        </div>
      </div>

      {availableTasks.length === 0 && completedCount === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">Пока нет доступных заданий</p>
        </div>
      ) : availableTasks.length === 0 ? (
        <div className="text-center py-4 text-green-600">
          <Trophy className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Все задания выполнены!</p>
          <p className="text-xs text-gray-500">Ожидайте новых заданий</p>
        </div>
      ) : (
        <div className="space-y-3">
          {availableTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isCompleted={false}
              onComplete={handleCompleteTask}
              isCompleting={completeTaskMutation.isPending}
            />
          ))}
          
          {completedCount > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Выполнено заданий: {completedCount}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TasksSection;
