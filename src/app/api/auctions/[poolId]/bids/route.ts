import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createBidSchema = z.object({
  carrierId: z.number().int().positive().optional(),
  proposedRateUsd: z.number().positive()
});

export async function POST(request: Request, context: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await context.params;
  const numericPoolId = Number(poolId);

  if (!Number.isInteger(numericPoolId) || numericPoolId <= 0) {
    return NextResponse.json({ error: "INVALID_POOL_ID" }, { status: 400 });
  }

  const parsed = createBidSchema.safeParse(await request.json());

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

  if (pool.status !== "AUCTION") {
    return NextResponse.json({ error: "POOL_NOT_IN_AUCTION" }, { status: 409 });
  }

  const carrier =
    parsed.data.carrierId == null
      ? await prisma.user.findFirst({ where: { username: "carrier", role: "CARRIER" } })
      : await prisma.user.findUnique({ where: { id: parsed.data.carrierId } });

  if (!carrier || carrier.role !== "CARRIER") {
    return NextResponse.json({ error: "CARRIER_NOT_FOUND" }, { status: 404 });
  }

  const currentLowestRate = pool.bids[0]?.proposedRateUsd == null ? null : Number(pool.bids[0].proposedRateUsd);
  const isCurrentLowest = currentLowestRate == null || parsed.data.proposedRateUsd < currentLowestRate;

  if (!pool.limitOverride && parsed.data.proposedRateUsd >= Number(pool.scfiBaseRateUsd)) {
    return NextResponse.json({ error: "BID_MUST_BE_BELOW_BASE_RATE" }, { status: 422 });
  }

  if (!isCurrentLowest) {
    return NextResponse.json({ error: "BID_MUST_BE_LOWER_THAN_CURRENT_LOWEST" }, { status: 422 });
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
