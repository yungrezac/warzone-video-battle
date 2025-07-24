import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BattleTrophiesProps {
  userId: string;
}

const BattleTrophies: React.FC<BattleTrophiesProps> = ({ userId }) => {
  const { data: trophies, isLoading } = useQuery({
    queryKey: ['battle-trophies', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('battle_trophies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Кубки видеобатлов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  if (!trophies || trophies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Кубки видеобатлов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Пока нет побед в видеобатлах
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Кубки видеобатлов ({trophies.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trophies.map((trophy) => (
            <div
              key={trophy.id}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <Trophy className="w-8 h-8 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{trophy.battle_title}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(trophy.battle_date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-yellow-500 text-yellow-900">
                  <Star className="w-3 h-3 mr-1" />
                  {trophy.points_awarded} баллов
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BattleTrophies;