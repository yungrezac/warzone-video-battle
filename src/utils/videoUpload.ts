import { supabase } from '@/integrations/supabase/client';

export const uploadBattleVideo = async (file: File, battleId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${battleId}_${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(`battles/${fileName}`, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Ошибка загрузки видео: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('videos')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};