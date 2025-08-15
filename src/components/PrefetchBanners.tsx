
import { useHomeBanners } from '@/hooks/useHomeBanners';
import { useMarketBanners } from '@/hooks/useMarketBanners';
import { useTournamentBanners } from '@/hooks/useTournamentBanners';

const PrefetchBanners = () => {
  useHomeBanners();
  useMarketBanners();
  useTournamentBanners();

  return null;
};

export default PrefetchBanners;
