import { PoolStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function runGlobalTimelineBatch(now = new Date()) {
  const switched = await prisma.coBuyPool.updateMany({
    where: {
      status: PoolStatus.AGGREGATING,
      auctionStartUtc: { lte: now }
    },
    data: { status: PoolStatus.AUCTION }
  });

  const failedPools = await prisma.coBuyPool.findMany({
    where: {
      status: PoolStatus.AUCTION,
      auctionEndUtc: { lte: now },
      winningCarrierId: null,
      bids: { none: {} }
    },
    select: { id: true, scfiBaseRateUsd: true }
  });

  for (const pool of failedPools) {
    await prisma.coBuyPool.update({
      where: { id: pool.id },
      data: {
        finalRateUsd: pool.scfiBaseRateUsd,
        status: PoolStatus.FAILED
      }
    });
  }

  const awardedCandidates = await prisma.coBuyPool.findMany({
    where: {
      status: PoolStatus.AUCTION,
      auctionEndUtc: { lte: now },
      winningCarrierId: null,
      bids: { some: {} }
    },
    include: { bids: { orderBy: [{ proposedRateUsd: "asc" }, { bidTime: "asc" }], take: 1 } }
  });

  const awardedUpdates: Array<Prisma.PrismaPromise<unknown>> = [];
  for (const pool of awardedCandidates) {
    const winningBid = pool.bids[0];
    if (!winningBid) continue;

    awardedUpdates.push(
      prisma.coBuyPool.update({
        where: { id: pool.id },
        data: {
          finalRateUsd: winningBid.proposedRateUsd,
          status: PoolStatus.AWARDED,
          winningCarrierId: winningBid.carrierId
        }
      })
    );
  }

  if (awardedUpdates.length > 0) {
    await prisma.$transaction(awardedUpdates);
  }

  return {
    awardedCount: awardedUpdates.length,
    failedCount: failedPools.length,
    switchedToAuctionCount: switched.count
  };
}
