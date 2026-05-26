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
    include: { _count: { select: { participants: true } } }
  });

  if (!pool) {
    return NextResponse.json({ error: "POOL_NOT_FOUND" }, { status: 404 });
  }

  if (pool.status !== "AGGREGATING") {
    return NextResponse.json({ error: "POOL_NOT_AGGREGATING" }, { status: 409 });
  }

  if (pool._count.participants === 0) {
    return NextResponse.json({ error: "POOL_HAS_NO_PARTICIPANTS" }, { status: 409 });
  }

  const updatedPool = await prisma.coBuyPool.update({
    where: { id: pool.id },
    data: { status: "AUCTION" }
  });

  return NextResponse.json({
    poolId: updatedPool.id,
    status: updatedPool.status,
    auctionStartUtc: updatedPool.auctionStartUtc.toISOString(),
    auctionEndUtc: updatedPool.auctionEndUtc.toISOString()
  });
}
