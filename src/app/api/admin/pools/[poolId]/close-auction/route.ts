import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { activeService } from "@/lib/product";

export async function POST(_request: Request, context: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await context.params;
  const numericPoolId = Number(poolId);

  if (!Number.isInteger(numericPoolId) || numericPoolId <= 0) {
    return NextResponse.json({ error: "INVALID_POOL_ID" }, { status: 400 });
  }

  const admin = await getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "ADMIN_ROLE_REQUIRED" }, { status: admin ? 403 : 401 });
  }

  const pool = await prisma.coBuyPool.findUnique({
    where: { id: numericPoolId },
    include: { bids: { orderBy: [{ proposedRateUsd: "asc" }, { bidTime: "asc" }] } }
  });

  if (!pool || pool.serviceCode !== activeService.code) {
    return NextResponse.json({ error: "POOL_NOT_FOUND" }, { status: 404 });
  }

  if (pool.status !== "AUCTION_LIVE") {
    return NextResponse.json({ error: "POOL_NOT_IN_AUCTION" }, { status: 409 });
  }

  if (pool.bids.length === 0) {
    const failedPool = await prisma.coBuyPool.update({
      where: { id: pool.id },
      data: { finalRateUsd: pool.scfiBaseRateUsd, status: "FAILED" }
    });

    await recordAuditLog({
      action: "POOL_CLOSE_AUCTION_FAILED",
      actorId: admin.id,
      after: { finalRateUsd: failedPool.finalRateUsd, id: failedPool.id, status: failedPool.status },
      before: { bidCount: 0, id: pool.id, status: pool.status },
      entityId: failedPool.id,
      entityType: "CoBuyPool"
    });

    return NextResponse.json({
      poolId: failedPool.id,
      status: failedPool.status,
      winningCarrierId: null,
      finalRateUsd: Number(failedPool.finalRateUsd)
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

  await recordAuditLog({
    action: "POOL_CLOSE_AUCTION_AWARDED",
    actorId: admin.id,
    after: {
      finalRateUsd: awardedPool.finalRateUsd,
      id: awardedPool.id,
      status: awardedPool.status,
      winningCarrierId: awardedPool.winningCarrierId
    },
    before: {
      bidCount: pool.bids.length,
      id: pool.id,
      status: pool.status,
      winningBidId: winningBid.id
    },
    entityId: awardedPool.id,
    entityType: "CoBuyPool"
  });

  return NextResponse.json({
    poolId: awardedPool.id,
    status: awardedPool.status,
    winningCarrierId: awardedPool.winningCarrierId,
    finalRateUsd: Number(awardedPool.finalRateUsd)
  });
}
