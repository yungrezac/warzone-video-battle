
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle, Coins } from 'lucide-react';
import { Task } from '@/hooks/useTasks';

interface TaskCardProps {
  task: Task;
  isCompleted?: boolean;
  onComplete: (taskId: string) => void;
  isCompleting?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  isCompleted = false, 
  onComplete, 
  isCompleting = false 
}) => {
  const handleChannelClick = () => {
    window.open(task.telegram_channel_url, '_blank');
  };

  return (
    <Card className={`${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-gray-900">
              {task.title}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              {task.description}
            </CardDescription>
          </div>
          <Badge variant={isCompleted ? "default" : "secondary"} className="ml-2">
            <Coins className="w-3 h-3 mr-1" />
            {task.reward_points}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleChannelClick}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Открыть канал
          </Button>
          
          {isCompleted ? (
            <Button variant="outline" size="sm" disabled className="flex-1 bg-green-100">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Выполнено
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => onComplete(task.id)}
              disabled={isCompleting}
              className="flex-1"
            >
              {isCompleting ? 'Выполняется...' : 'Выполнить'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
