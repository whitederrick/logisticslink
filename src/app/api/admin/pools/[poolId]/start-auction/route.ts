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
    include: { _count: { select: { participants: true } } }
  });

  if (!pool || pool.serviceCode !== activeService.code) {
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
    data: { status: "AUCTION_LIVE" }
  });

  await recordAuditLog({
    action: "POOL_START_AUCTION",
    actorId: admin.id,
    after: {
      auctionEndUtc: updatedPool.auctionEndUtc,
      auctionStartUtc: updatedPool.auctionStartUtc,
      id: updatedPool.id,
      status: updatedPool.status
    },
    before: { id: pool.id, participantCount: pool._count.participants, status: pool.status },
    entityId: updatedPool.id,
    entityType: "CoBuyPool"
  });

  return NextResponse.json({
    poolId: updatedPool.id,
    status: updatedPool.status,
    auctionStartUtc: updatedPool.auctionStartUtc.toISOString(),
    auctionEndUtc: updatedPool.auctionEndUtc.toISOString()
  });
}
