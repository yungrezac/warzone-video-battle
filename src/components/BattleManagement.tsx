import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  Upload, 
  Video, 
  CheckCircle, 
  XCircle,
  Timer,
  User
} from 'lucide-react';
import { useAuth } from '@/components/AuthWrapper';
import { useBattleParticipants, useUploadBattleVideo, useApproveVideo } from '@/hooks/useVideoBattles';
import { uploadBattleVideo } from '@/utils/videoUpload';
import { toast } from 'sonner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import VideoPlayer from './VideoPlayer';

interface BattleManagementProps {
  battle: {
    id: string;
    title: string;
    description: string;
    reference_video_url: string;
    reference_video_title: string;
    status: 'registration' | 'active' | 'completed' | 'cancelled';
    current_participant_id?: string;
    current_deadline?: string;
    time_limit_minutes: number;
    current_video_sequence: number;
  };
  isJudge: boolean;
  isOrganizer: boolean;
}

const BattleManagement: React.FC<BattleManagementProps> = ({ battle, isJudge, isOrganizer }) => {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { data: participants } = useBattleParticipants(battle.id);
  const uploadVideoMutation = useUploadBattleVideo();
  const approveVideoMutation = useApproveVideo();

  const currentParticipant = participants?.find(p => p.id === battle.current_participant_id);
  const isCurrentParticipant = currentParticipant?.user_id === user?.id;

  // Вычисляем оставшееся время
  React.useEffect(() => {
    if (!battle.current_deadline) return;

    const updateTimer = () => {
      const deadline = new Date(battle.current_deadline!);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft(0);
        return;
      }
      
      setTimeLeft(Math.floor(diff / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [battle.current_deadline]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setSelectedVideo(file);
        toast.success(`Выбрано видео: ${file.name}`);
      } else {
        toast.error('Выберите видео файл');
      }
    }
  };

  const handleUploadVideo = async () => {
    if (!selectedVideo || !videoTitle.trim() || !currentParticipant) {
      toast.error('Заполните название и выберите видео');
      return;
    }

    setIsUploading(true);
    try {
      const videoUrl = await uploadBattleVideo(selectedVideo, battle.id);
      
      uploadVideoMutation.mutate({
        battleId: battle.id,
        participantId: currentParticipant.id,
        videoUrl,
        title: videoTitle,
        sequenceNumber: battle.current_video_sequence,
      }, {
        onSuccess: () => {
          setSelectedVideo(null);
          setVideoTitle('');
          toast.success('Видео загружено! Ожидайте проверки судьи.');
        },
        onError: () => {
          toast.error('Ошибка при загрузке видео');
        }
      });
    } catch (error) {
      toast.error('Ошибка при загрузке видео');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApproveVideo = (videoId: string, isApproved: boolean) => {
    if (!user?.id) return;

    approveVideoMutation.mutate({
      videoId,
      isApproved,
      judgeId: user.id,
    });
  };

  if (battle.status !== 'active') {
    return null;
  }

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-green-500" />
          <span>Активный батл: {battle.title}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Текущее эталонное видео */}
        <div>
          <h4 className="font-semibold mb-2">
            Эталонное видео (Последовательность #{battle.current_video_sequence}):
          </h4>
          <div className="rounded-lg overflow-hidden">
            <AspectRatio ratio={16 / 9} className="bg-black">
              <VideoPlayer
                src={battle.reference_video_url}
                thumbnail="/placeholder.svg"
                title={battle.reference_video_title}
                className="w-full h-full"
                videoId={`battle-current-${battle.id}`}
              />
            </AspectRatio>
          </div>
        </div>

        {/* Информация о текущем участнике */}
        {currentParticipant && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-semibold">
                  Сейчас ход: {(currentParticipant as any).profiles?.first_name || 'Участник'}
                </span>
                {currentParticipant.full_letters && (
                  <Badge variant="destructive">
                    FULL: {currentParticipant.full_letters}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                <span className={`font-mono ${timeLeft < 60 ? 'text-red-500' : 'text-gray-600'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
            <Progress value={(timeLeft / (battle.time_limit_minutes * 60)) * 100} className="h-2" />
          </div>
        )}

        {/* Форма загрузки видео для текущего участника */}
        {isCurrentParticipant && timeLeft > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-4">
            <h4 className="font-semibold">Загрузите ваше видео:</h4>
            <p className="text-sm text-gray-600">
              Повторите эталонную связку и добавьте новый трюк в конец.
            </p>
            
            <div>
              <Label htmlFor="video-title">Название видео *</Label>
              <Input
                id="video-title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Введите название видео"
                disabled={isUploading}
              />
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2"
                disabled={isUploading}
              >
                <Upload className="w-4 h-4" />
                {selectedVideo ? selectedVideo.name : 'Выберите видео файл'}
              </Button>
            </div>

            {selectedVideo && (
              <Button
                onClick={handleUploadVideo}
                disabled={isUploading || !videoTitle.trim()}
                className="w-full"
              >
                {isUploading ? 'Загрузка...' : 'Загрузить видео'}
              </Button>
            )}
          </div>
        )}

        {/* Информация для не активных участников */}
        {!isCurrentParticipant && participants?.some(p => p.user_id === user?.id && p.status === 'active') && (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-600">Ожидайте своей очереди...</p>
          </div>
        )}

        {/* Панель судьи/организатора */}
        {(isJudge || isOrganizer) && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Панель судьи</h4>
            <p className="text-sm text-gray-600 mb-4">
              Ожидание загрузки видео от участника...
            </p>
            
            {/* Здесь будут отображаться загруженные видео для проверки */}
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => handleApproveVideo('video-id', true)}
                className="w-full flex items-center gap-2 text-green-600"
                disabled={approveVideoMutation.isPending}
              >
                <CheckCircle className="w-4 h-4" />
                Одобрить видео
              </Button>
              <Button
                variant="outline"
                onClick={() => handleApproveVideo('video-id', false)}
                className="w-full flex items-center gap-2 text-red-600"
                disabled={approveVideoMutation.isPending}
              >
                <XCircle className="w-4 h-4" />
                Отклонить видео (добавить букву FULL)
              </Button>
            </div>
          </div>
        )}

        {/* Список участников */}
        <div>
          <h4 className="font-semibold mb-2">Участники ({participants?.filter(p => p.status === 'active').length || 0}):</h4>
          <div className="space-y-2">
            {participants?.filter(p => p.status === 'active').map((participant) => (
              <div
                key={participant.id}
                className={`flex items-center justify-between p-2 rounded ${
                  participant.id === battle.current_participant_id ? 'bg-yellow-100' : 'bg-gray-50'
                }`}
              >
                <span>{(participant as any).profiles?.first_name || 'Участник'}</span>
                <div className="flex items-center gap-2">
                  {participant.full_letters && (
                    <Badge variant="destructive" className="text-xs">
                      {participant.full_letters}
                    </Badge>
                  )}
                  {participant.id === battle.current_participant_id && (
                    <Badge className="text-xs">Сейчас ход</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BattleManagement;