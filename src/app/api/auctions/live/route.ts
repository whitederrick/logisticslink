import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAvailableRateBenchmarks } from "@/lib/rate-benchmark";

export async function GET() {
  const carrier = await getCurrentUser();

  if (!carrier || carrier.role !== "CARRIER") {
    return NextResponse.json({ error: "CARRIER_ROLE_REQUIRED" }, { status: carrier ? 403 : 401 });
  }

  const [auctionPools, myBids] = await Promise.all([
    prisma.coBuyPool.findMany({
      where: { status: "AUCTION" },
      include: {
        bids: { orderBy: [{ proposedRateUsd: "asc" }, { bidTime: "asc" }], take: 1 },
        _count: { select: { bids: true, participants: true } }
      },
      orderBy: { auctionEndUtc: "asc" },
      take: 12
    }),
    prisma.auctionBid.findMany({
      where: { carrierId: carrier.id },
      include: { pool: true },
      orderBy: { bidTime: "desc" },
      take: 8
    })
  ]);

  const auctionPoolPayload = await Promise.all(
    auctionPools.map(async (pool) => ({
      auctionEndUtc: pool.auctionEndUtc.toISOString(),
      bidCount: pool._count.bids,
      containerType: pool.containerType,
      currentLowestRateUsd: pool.bids[0] ? Number(pool.bids[0].proposedRateUsd) : null,
      rateBenchmarks: await getAvailableRateBenchmarks({
        containerType: pool.containerType,
        isReefer: pool.isReefer,
        podCode: pool.podCode,
        polCode: pool.polCode
      }),
      participantCount: pool._count.participants,
      podCode: pool.podCode,
      polCode: pool.polCode,
      poolId: pool.id,
      scfiBaseRateUsd: Number(pool.scfiBaseRateUsd),
      targetEtd: pool.targetEtd.toISOString()
    }))
  );

  return NextResponse.json({
    auctionPools: auctionPoolPayload,
    myBids: myBids.map((bid) => ({
      bidId: bid.id,
      isWinningAtTime: bid.isWinningAtTime,
      podCode: bid.pool.podCode,
      polCode: bid.pool.polCode,
      poolId: bid.poolId,
      proposedRateUsd: Number(bid.proposedRateUsd)
    })),
    refreshedAt: new Date().toISOString()
  });
}
