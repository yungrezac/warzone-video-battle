
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, StarIcon } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import VideoPlayer from './VideoPlayer';
import { useAuth } from '@/components/AuthWrapper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRateVideo } from '@/hooks/useOnlineTournaments';

interface TournamentVideoCardProps {
  video: {
    id: string;
    title: string;
    video_url: string;
    thumbnail_url?: string;
    user_id: string;
    tournament_id: string;
    profiles?: {
      username?: string;
      first_name?: string;
      avatar_url?: string;
    };
  };
  isJudge?: boolean;
}

const TournamentVideoCard: React.FC<TournamentVideoCardProps> = ({ video, isJudge }) => {
  const { user } = useAuth();
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const rateVideoMutation = useRateVideo();

  const { data: existingRating } = useQuery({
    queryKey: ['video-rating', video.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !isJudge) return null;
      
      const { data, error } = await supabase
        .from('tournament_video_ratings')
        .select('rating')
        .eq('video_id', video.id)
        .eq('judge_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.rating || 0;
    },
    enabled: !!user?.id && isJudge,
  });

  const { data: averageRating } = useQuery({
    queryKey: ['video-average-rating', video.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_video_ratings')
        .select('rating')
        .eq('video_id', video.id);

      if (error) throw error;

      if (data.length === 0) return 0;
      const sum = data.reduce((acc, item) => acc + item.rating, 0);
      return sum / data.length;
    },
  });

  const handleRating = (rating: number) => {
    if (!isJudge || !user?.id) return;

    setSelectedRating(rating);
    rateVideoMutation.mutate({
      tournamentId: video.tournament_id,
      videoId: video.id,
      judgeId: user.id,
      rating,
    });
  };

  const displayName = video.profiles?.first_name || video.profiles?.username || 'Участник';
  const currentRating = existingRating || selectedRating;

  return (
    <Card className="mb-4 overflow-hidden">
      <div className="relative">
        <AspectRatio ratio={9 / 16} className="bg-black">
          <VideoPlayer
            src={video.video_url}
            thumbnail={video.thumbnail_url}
            title={video.title}
            className="w-full h-full"
            videoId={video.id}
          />
        </AspectRatio>
      </div>

      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <img
              src={video.profiles?.avatar_url || '/placeholder-avatar.png'}
              alt={displayName}
              className="w-8 h-8 rounded-full mr-2"
            />
            <div>
              <h3 className="font-semibold text-sm">{video.title}</h3>
              <p className="text-gray-600 text-xs">@{displayName}</p>
            </div>
          </div>
          
          {averageRating !== undefined && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">
                {averageRating > 0 ? averageRating.toFixed(1) : 'Нет оценок'}
              </span>
            </div>
          )}
        </div>

        {isJudge && user?.id && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-gray-600">Ваша оценка:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <Button
                  key={rating}
                  variant="ghost"
                  size="sm"
                  className={`p-1 h-8 w-8 ${
                    rating <= currentRating
                      ? 'text-yellow-500'
                      : 'text-gray-300'
                  }`}
                  onClick={() => handleRating(rating)}
                  disabled={rateVideoMutation.isPending}
                >
                  <StarIcon className={`w-4 h-4 ${
                    rating <= currentRating ? 'fill-current' : ''
                  }`} />
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TournamentVideoCard;
