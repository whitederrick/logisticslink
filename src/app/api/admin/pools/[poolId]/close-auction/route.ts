import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, context: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await context.params;
  const numericPoolId = Number(poolId);

  if (!Number.isInteger(numericPoolId) || numericPoolId <= 0) {
    return NextResponse.json({ error: "INVALID_POOL_ID" }, { status: 400 });
  }

  const pool = await prisma.coBuyPool.findUnique({
    where: { id: numericPoolId },
    include: { bids: { orderBy: [{ proposedRateUsd: "asc" }, { bidTime: "asc" }] } }
  });

  if (!pool) {
    return NextResponse.json({ error: "POOL_NOT_FOUND" }, { status: 404 });
  }

  if (pool.status !== "AUCTION") {
    return NextResponse.json({ error: "POOL_NOT_IN_AUCTION" }, { status: 409 });
  }

  if (pool.bids.length === 0) {
    const failedPool = await prisma.coBuyPool.update({
      where: { id: pool.id },
      data: { status: "FAILED" }
    });

    return NextResponse.json({
      poolId: failedPool.id,
      status: failedPool.status,
      winningCarrierId: null,
      finalRateUsd: null
    });
  }

  const winningBid = pool.bids[0];
  const awardedPool = await prisma.coBuyPool.update({
    where: { id: pool.id },
    data: {
      status: "AWARDED",
      winningCarrierId: winningBid.carrierId,
      finalRateUsd: winningBid.proposedRateUsd
    }
  });

  return NextResponse.json({
    poolId: awardedPool.id,
    status: awardedPool.status,
    winningCarrierId: awardedPool.winningCarrierId,
    finalRateUsd: Number(awardedPool.finalRateUsd)
  });
}
