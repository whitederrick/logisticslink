type QuoteLike = {
  serviceCode?: string;
  polCode: string;
  podCode: string;
  targetEtd: Date;
  cargoType?: string | null;
  containerType?: string | null;
  isHeavy: boolean;
  isHazardous: boolean;
  isReefer: boolean;
};

type PoolLike = QuoteLike & {
  id: number;
  status: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function isPoolMatch(quote: QuoteLike, pool: PoolLike) {
  const etdDiffDays = Math.abs(
    Math.round((quote.targetEtd.getTime() - pool.targetEtd.getTime()) / DAY_MS)
  );

  return (
    pool.status === "AGGREGATING" &&
    pool.serviceCode === quote.serviceCode &&
    pool.polCode === quote.polCode &&
    pool.podCode === quote.podCode &&
    pool.cargoType === quote.cargoType &&
    pool.containerType === quote.containerType &&
    pool.isHeavy === quote.isHeavy &&
    pool.isHazardous === quote.isHazardous &&
    pool.isReefer === quote.isReefer &&
    etdDiffDays <= 3
  );
}
