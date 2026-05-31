import { NextResponse } from "next/server";
import { bidRequestSchema, parsePositiveRouteId } from "@/lib/api-contract";
import { validateCarrierBid } from "@/lib/bid-validation";
import { getCurrentUser, operationalAccessError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await context.params;
  const numericPoolId = parsePositiveRouteId(poolId);

  if (!numericPoolId) {
    return NextResponse.json({ error: "INVALID_POOL_ID" }, { status: 400 });
  }

  const parsed = bidRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_BID_REQUEST", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const pool = await prisma.coBuyPool.findUnique({
    where: { id: numericPoolId },
    include: { bids: { orderBy: { proposedRateUsd: "asc" }, take: 1 } }
  });

  if (!pool) {
    return NextResponse.json({ error: "POOL_NOT_FOUND" }, { status: 404 });
  }

  const now = new Date();

  const carrier = await getCurrentUser();

  if (!carrier || carrier.role !== "CARRIER") {
    return NextResponse.json({ error: "CARRIER_ROLE_REQUIRED" }, { status: carrier ? 403 : 401 });
  }

  const accessError = operationalAccessError(carrier);
  if (accessError) {
    return NextResponse.json({ error: accessError }, { status: 403 });
  }

  const currentLowestRate = pool.bids[0]?.proposedRateUsd == null ? null : Number(pool.bids[0].proposedRateUsd);
  const bidError = validateCarrierBid({
    auctionEndUtc: pool.auctionEndUtc,
    auctionStartUtc: pool.auctionStartUtc,
    carrierStatus: carrier.status,
    currentLowestRate,
    limitOverride: pool.limitOverride,
    now,
    proposedRateUsd: parsed.data.proposedRateUsd,
    scfiBaseRateUsd: Number(pool.scfiBaseRateUsd),
    status: pool.status
  });

  if (bidError) {
    const status = bidError === "CARRIER_NOT_ALLOWED_TO_BID" ? 403 : bidError.includes("LOCK") || bidError === "POOL_NOT_IN_AUCTION" ? 409 : 422;
    return NextResponse.json({ error: bidError }, { status });
  }

  const bid = await prisma.$transaction(async (tx) => {
    await tx.auctionBid.updateMany({
      where: { poolId: pool.id, isWinningAtTime: true },
      data: { isWinningAtTime: false }
    });

    return tx.auctionBid.create({
      data: {
        poolId: pool.id,
        carrierId: carrier.id,
        proposedRateUsd: parsed.data.proposedRateUsd,
        isWinningAtTime: true
      }
    });
  });

  return NextResponse.json(
    {
      bidId: bid.id,
      poolId: bid.poolId,
      isCurrentLowest: bid.isWinningAtTime,
      proposedRateUsd: Number(bid.proposedRateUsd)
    },
    { status: 201 }
  );
}
