export type RateBenchmarkSource =
  | "SCFI"
  | "FBX"
  | "DREWRY_WCI"
  | "CARRIER_FAK"
  | "CARRIER_PUBLIC_TARIFF"
  | "XENETA_SPOT"
  | "XENETA_CONTRACT"
  | "COMMERCIAL_API"
  | "INTERNAL_MASTER";

export type RateBenchmarkTier = "PUBLIC" | "PARTNER" | "PAID" | "INTERNAL" | "LEGACY";

export type RateBenchmarkType = "MARKET_INDEX" | "SPOT_RATE" | "CONTRACT_RATE" | "FAK" | "PUBLIC_TARIFF" | "INTERNAL_MASTER";

export type RateBenchmark = {
  benchmarkType: RateBenchmarkType;
  confidenceScore: number;
  currency: string;
  externalRef?: string | null;
  provider?: string | null;
  rateUsd: number;
  source: RateBenchmarkSource;
  sourceLabel: string;
  sourceTier: RateBenchmarkTier;
  validFrom: string;
  collectedAt?: string;
};

type RateBenchmarkInput = {
  containerType?: string | null;
  isReefer?: boolean;
  podCode: string;
  polCode: string;
};

const benchmarkMaster: Array<RateBenchmark & { containerGroup: "DRY" | "REEFER" | "LCL"; podCode: string; polCode: string }> = [
  {
    containerGroup: "DRY",
    podCode: "USLGB",
    polCode: "KRPUS",
    benchmarkType: "MARKET_INDEX",
    confidenceScore: 70,
    currency: "USD",
    provider: "Shanghai Shipping Exchange",
    rateUsd: 3180,
    source: "SCFI",
    sourceLabel: "SCFI Korea-USWC proxy",
    sourceTier: "LEGACY",
    validFrom: "2026-05-20"
  },
  {
    containerGroup: "DRY",
    podCode: "USLGB",
    polCode: "KRPUS",
    benchmarkType: "FAK",
    confidenceScore: 80,
    currency: "USD",
    provider: "Carrier rate sheet",
    rateUsd: 3270,
    source: "CARRIER_FAK",
    sourceLabel: "Carrier FAK filed rate",
    sourceTier: "LEGACY",
    validFrom: "2026-05-21"
  },
  {
    containerGroup: "DRY",
    podCode: "USLGB",
    polCode: "KRPUS",
    benchmarkType: "PUBLIC_TARIFF",
    confidenceScore: 65,
    currency: "USD",
    provider: "Carrier public tariff",
    rateUsd: 3340,
    source: "CARRIER_PUBLIC_TARIFF",
    sourceLabel: "Carrier public web tariff",
    sourceTier: "LEGACY",
    validFrom: "2026-05-18"
  },
  {
    containerGroup: "DRY",
    podCode: "USLGB",
    polCode: "KRPUS",
    benchmarkType: "INTERNAL_MASTER",
    confidenceScore: 85,
    currency: "USD",
    provider: "LogisticsLink Ocean",
    rateUsd: 3210,
    source: "INTERNAL_MASTER",
    sourceLabel: "LogisticsLink Ocean internal rate master",
    sourceTier: "LEGACY",
    validFrom: "2026-05-22"
  },
  {
    containerGroup: "REEFER",
    podCode: "USLAX",
    polCode: "KRPUS",
    benchmarkType: "MARKET_INDEX",
    confidenceScore: 70,
    currency: "USD",
    provider: "Shanghai Shipping Exchange",
    rateUsd: 4050,
    source: "SCFI",
    sourceLabel: "SCFI Korea-USWC reefer proxy",
    sourceTier: "LEGACY",
    validFrom: "2026-05-20"
  },
  {
    containerGroup: "REEFER",
    podCode: "USLAX",
    polCode: "KRPUS",
    benchmarkType: "FAK",
    confidenceScore: 80,
    currency: "USD",
    provider: "Carrier rate sheet",
    rateUsd: 4180,
    source: "CARRIER_FAK",
    sourceLabel: "Carrier FAK reefer filed rate",
    sourceTier: "LEGACY",
    validFrom: "2026-05-21"
  },
  {
    containerGroup: "REEFER",
    podCode: "USLAX",
    polCode: "KRPUS",
    benchmarkType: "PUBLIC_TARIFF",
    confidenceScore: 65,
    currency: "USD",
    provider: "Carrier public tariff",
    rateUsd: 4230,
    source: "CARRIER_PUBLIC_TARIFF",
    sourceLabel: "Carrier public reefer tariff",
    sourceTier: "LEGACY",
    validFrom: "2026-05-18"
  },
  {
    containerGroup: "REEFER",
    podCode: "USLAX",
    polCode: "KRPUS",
    benchmarkType: "INTERNAL_MASTER",
    confidenceScore: 85,
    currency: "USD",
    provider: "LogisticsLink Ocean",
    rateUsd: 4110,
    source: "INTERNAL_MASTER",
    sourceLabel: "LogisticsLink Ocean internal reefer master",
    sourceTier: "LEGACY",
    validFrom: "2026-05-22"
  }
];

export function resolveContainerGroup(input: RateBenchmarkInput): "DRY" | "REEFER" | "LCL" {
  if (input.isReefer || input.containerType?.includes("REEFER")) return "REEFER";
  if (!input.containerType) return "LCL";
  return "DRY";
}

export function getRateBenchmarks(input: RateBenchmarkInput): RateBenchmark[] {
  const group = resolveContainerGroup(input);
  return benchmarkMaster
    .filter((benchmark) => benchmark.polCode === input.polCode && benchmark.podCode === input.podCode && benchmark.containerGroup === group)
    .map(({ containerGroup: _containerGroup, podCode: _podCode, polCode: _polCode, ...benchmark }) => benchmark);
}

export async function getDbRateBenchmarks(input: RateBenchmarkInput): Promise<RateBenchmark[]> {
  const { prisma } = await import("@/lib/prisma");
  const group = resolveContainerGroup(input);
  const rows = await prisma.$queryRaw<
    Array<{
      collectedAt: Date;
      benchmarkType: RateBenchmarkType;
      confidenceScore: number;
      currency: string;
      externalRef: string | null;
      provider: string | null;
      rateUsd: unknown;
      source: RateBenchmarkSource;
      sourceLabel: string;
      sourceTier: RateBenchmarkTier;
      validFrom: Date;
    }>
  >`
    SELECT "benchmarkType", "collectedAt", "confidenceScore", "currency", "externalRef", "provider", "rateUsd", "source", "sourceLabel", "sourceTier", "validFrom"
    FROM "FreightRateBenchmark"
    WHERE "polCode" = ${input.polCode}
      AND "podCode" = ${input.podCode}
      AND "containerGroup" = ${group}
      AND ("validTo" IS NULL OR "validTo" >= NOW())
    ORDER BY "validFrom" DESC, "rateUsd" ASC
  `;

  return rows.map((row) => ({
    benchmarkType: row.benchmarkType,
    collectedAt: row.collectedAt.toISOString(),
    confidenceScore: row.confidenceScore,
    currency: row.currency,
    externalRef: row.externalRef,
    provider: row.provider,
    rateUsd: Number(row.rateUsd),
    source: row.source,
    sourceLabel: row.sourceLabel,
    sourceTier: row.sourceTier,
    validFrom: row.validFrom.toISOString().slice(0, 10)
  }));
}

export async function getAvailableRateBenchmarks(input: RateBenchmarkInput): Promise<RateBenchmark[]> {
  const dbBenchmarks = await getDbRateBenchmarks(input);
  const legacyBenchmarks = getRateBenchmarks(input);
  const dbKeys = new Set(dbBenchmarks.map((benchmark) => `${benchmark.source}:${benchmark.validFrom}:${benchmark.rateUsd}`));
  const missingLegacyBenchmarks = legacyBenchmarks.filter((benchmark) => !dbKeys.has(`${benchmark.source}:${benchmark.validFrom}:${benchmark.rateUsd}`));

  return [...dbBenchmarks, ...missingLegacyBenchmarks].sort((left, right) => left.rateUsd - right.rateUsd);
}

export function resolveAuctionCeiling(input: RateBenchmarkInput & { fallbackRateUsd: number }) {
  const benchmarks = getRateBenchmarks(input);
  const applied = benchmarks.length > 0 ? benchmarks.reduce((lowest, benchmark) => (benchmark.rateUsd < lowest.rateUsd ? benchmark : lowest)) : null;

  return {
    appliedRateUsd: applied?.rateUsd ?? input.fallbackRateUsd,
    appliedSource: applied?.source ?? "INTERNAL_MASTER",
    benchmarks
  };
}

export async function resolveAuctionCeilingFromBenchmarks(input: RateBenchmarkInput & { fallbackRateUsd: number }) {
  const benchmarks = await getAvailableRateBenchmarks(input);
  const applied = benchmarks.length > 0 ? benchmarks.reduce((lowest, benchmark) => (benchmark.rateUsd < lowest.rateUsd ? benchmark : lowest)) : null;

  return {
    appliedRateUsd: applied?.rateUsd ?? input.fallbackRateUsd,
    appliedSource: applied?.source ?? "INTERNAL_MASTER",
    benchmarks
  };
}
