ALTER TYPE "RateBenchmarkSource" ADD VALUE IF NOT EXISTS 'FBX';
ALTER TYPE "RateBenchmarkSource" ADD VALUE IF NOT EXISTS 'DREWRY_WCI';
ALTER TYPE "RateBenchmarkSource" ADD VALUE IF NOT EXISTS 'XENETA_SPOT';
ALTER TYPE "RateBenchmarkSource" ADD VALUE IF NOT EXISTS 'XENETA_CONTRACT';
ALTER TYPE "RateBenchmarkSource" ADD VALUE IF NOT EXISTS 'COMMERCIAL_API';

CREATE TYPE "RateBenchmarkTier" AS ENUM ('PUBLIC', 'PARTNER', 'PAID', 'INTERNAL', 'LEGACY');
CREATE TYPE "RateBenchmarkType" AS ENUM ('MARKET_INDEX', 'SPOT_RATE', 'CONTRACT_RATE', 'FAK', 'PUBLIC_TARIFF', 'INTERNAL_MASTER');

ALTER TABLE "FreightRateBenchmark"
  ADD COLUMN "sourceTier" "RateBenchmarkTier" NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN "benchmarkType" "RateBenchmarkType" NOT NULL DEFAULT 'MARKET_INDEX',
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "externalRef" TEXT,
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN "confidenceScore" INTEGER NOT NULL DEFAULT 70;

UPDATE "FreightRateBenchmark"
SET
  "sourceTier" = CASE
    WHEN "source" = 'INTERNAL_MASTER' THEN 'INTERNAL'::"RateBenchmarkTier"
    WHEN "source" IN ('CARRIER_FAK', 'CARRIER_PUBLIC_TARIFF') THEN 'PARTNER'::"RateBenchmarkTier"
    ELSE 'PUBLIC'::"RateBenchmarkTier"
  END,
  "benchmarkType" = CASE
    WHEN "source" = 'CARRIER_FAK' THEN 'FAK'::"RateBenchmarkType"
    WHEN "source" = 'CARRIER_PUBLIC_TARIFF' THEN 'PUBLIC_TARIFF'::"RateBenchmarkType"
    WHEN "source" = 'INTERNAL_MASTER' THEN 'INTERNAL_MASTER'::"RateBenchmarkType"
    ELSE 'MARKET_INDEX'::"RateBenchmarkType"
  END,
  "provider" = CASE
    WHEN "source" = 'SCFI' THEN 'Shanghai Shipping Exchange'
    WHEN "source" = 'CARRIER_FAK' THEN 'Carrier rate sheet'
    WHEN "source" = 'CARRIER_PUBLIC_TARIFF' THEN 'Carrier public tariff'
    WHEN "source" = 'INTERNAL_MASTER' THEN 'ForwardLink'
    ELSE "sourceLabel"
  END,
  "confidenceScore" = CASE
    WHEN "source" = 'INTERNAL_MASTER' THEN 85
    WHEN "source" = 'CARRIER_FAK' THEN 80
    WHEN "source" = 'CARRIER_PUBLIC_TARIFF' THEN 65
    ELSE 70
  END;

CREATE INDEX "FreightRateBenchmark_sourceTier_benchmarkType_idx" ON "FreightRateBenchmark"("sourceTier", "benchmarkType");
