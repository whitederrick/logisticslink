CREATE TYPE "RateBenchmarkSource" AS ENUM ('SCFI', 'CARRIER_FAK', 'CARRIER_PUBLIC_TARIFF', 'INTERNAL_MASTER');

CREATE TABLE "FreightRateBenchmark" (
    "id" SERIAL NOT NULL,
    "source" "RateBenchmarkSource" NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "polCode" TEXT NOT NULL,
    "podCode" TEXT NOT NULL,
    "containerGroup" TEXT NOT NULL,
    "rateUsd" DECIMAL(10,2) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreightRateBenchmark_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FreightRateBenchmark_source_polCode_podCode_containerGroup_validFrom_key" ON "FreightRateBenchmark"("source", "polCode", "podCode", "containerGroup", "validFrom");
CREATE INDEX "FreightRateBenchmark_polCode_podCode_containerGroup_validFrom_idx" ON "FreightRateBenchmark"("polCode", "podCode", "containerGroup", "validFrom");
