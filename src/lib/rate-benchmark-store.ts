import { prisma } from "@/lib/prisma";
import { RateBenchmarkInput } from "@/lib/rate-benchmark-input";

type StoredRateBenchmark = {
  benchmarkType: string;
  confidenceScore: number;
  containerGroup: string;
  currency: string;
  externalRef: string | null;
  id: number;
  podCode: string;
  polCode: string;
  provider: string | null;
  rateUsd: unknown;
  source: string;
  sourceLabel: string;
  sourceTier: string;
  validFrom: Date;
};

export async function upsertRateBenchmark(input: RateBenchmarkInput) {
  const validFrom = new Date(`${input.validFrom}T00:00:00.000Z`);

  const [rate] = await prisma.$queryRaw<StoredRateBenchmark[]>`
    INSERT INTO "FreightRateBenchmark" (
      "source", "sourceTier", "benchmarkType", "sourceLabel", "provider", "externalRef",
      "polCode", "podCode", "containerGroup", "currency", "rateUsd", "confidenceScore", "validFrom", "updatedAt"
    )
    VALUES (
      ${input.source}::"RateBenchmarkSource", ${input.sourceTier}::"RateBenchmarkTier", ${input.benchmarkType}::"RateBenchmarkType",
      ${input.sourceLabel}, ${input.provider}, ${input.externalRef}, ${input.polCode}, ${input.podCode}, ${input.containerGroup},
      ${input.currency}, ${input.rateUsd}, ${input.confidenceScore}, ${validFrom}, NOW()
    )
    ON CONFLICT ("source", "polCode", "podCode", "containerGroup", "validFrom")
    DO UPDATE SET
      "sourceTier" = EXCLUDED."sourceTier",
      "benchmarkType" = EXCLUDED."benchmarkType",
      "sourceLabel" = EXCLUDED."sourceLabel",
      "provider" = EXCLUDED."provider",
      "externalRef" = EXCLUDED."externalRef",
      "currency" = EXCLUDED."currency",
      "rateUsd" = EXCLUDED."rateUsd",
      "confidenceScore" = EXCLUDED."confidenceScore",
      "updatedAt" = NOW(),
      "collectedAt" = NOW()
    RETURNING
      "benchmarkType", "confidenceScore", "containerGroup", "currency", "externalRef", "id", "podCode", "polCode",
      "provider", "rateUsd", "source", "sourceLabel", "sourceTier", "validFrom"
  `;

  return rate;
}

export async function upsertRateBenchmarks(inputs: RateBenchmarkInput[]) {
  const rates: StoredRateBenchmark[] = [];

  for (const input of inputs) {
    rates.push(await upsertRateBenchmark(input));
  }

  return rates;
}
