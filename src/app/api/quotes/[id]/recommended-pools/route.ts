import { NextResponse } from "next/server";
import { isPoolMatch } from "@/lib/matching";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function calculateMatchScore(targetEtd: Date, poolEtd: Date) {
  const etdDiffDays = Math.abs(Math.round((targetEtd.getTime() - poolEtd.getTime()) / DAY_MS));
  return Math.max(70, 100 - etdDiffDays * 5);
}

function calculateExpectedDiscountRate(totalVolumeTeu: number, totalVolumeCbm: number) {
  const volumeSignal = Math.max(totalVolumeTeu, totalVolumeCbm / 28);
  return Math.min(22, Math.round((8 + volumeSignal * 0.35) * 10) / 10);
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const quoteId = Number(id);

  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    return NextResponse.json({ error: "INVALID_QUOTE_ID" }, { status: 400 });
  }

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });

  if (!quote) {
    return NextResponse.json({ error: "QUOTE_NOT_FOUND" }, { status: 404 });
  }

  const candidatePools = await prisma.coBuyPool.findMany({
    where: {
      status: "AGGREGATING",
      polCode: quote.polCode,
      podCode: quote.podCode,
      cargoType: quote.cargoType,
      containerType: quote.containerType,
      isHeavy: quote.isHeavy,
      isHazardous: quote.isHazardous,
      isReefer: quote.isReefer
    },
    orderBy: { auctionStartUtc: "asc" }
  });

  const recommendedPools = candidatePools
    .filter((pool) => isPoolMatch(quote, pool))
    .map((pool) => {
      const totalVolumeTeu = Number(pool.totalVolumeTeu);
      const totalVolumeCbm = Number(pool.totalVolumeCbm);

      return {
        poolId: pool.id,
        polCode: pool.polCode,
        podCode: pool.podCode,
        targetEtd: pool.targetEtd.toISOString(),
        currentTotalVolumeTeu: totalVolumeTeu,
        daysUntilClose: Math.max(0, Math.ceil((pool.auctionStartUtc.getTime() - Date.now()) / DAY_MS)),
        matchScore: calculateMatchScore(quote.targetEtd, pool.targetEtd),
        expectedDiscountRate: calculateExpectedDiscountRate(totalVolumeTeu, totalVolumeCbm)
      };
    });

  return NextResponse.json({ quoteId, recommendedPools });
}
