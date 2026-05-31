import { NextResponse } from "next/server";
import { parsePositiveRouteId, shipmentStatusRequestSchema } from "@/lib/api-contract";
import { getCurrentUser } from "@/lib/auth";
import { isShipmentStatus, nextShipmentStatus } from "@/lib/shipment-workflow";
import { recordAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, context: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await context.params;
  const numericPoolId = parsePositiveRouteId(poolId);

  if (!numericPoolId) {
    return NextResponse.json({ error: "INVALID_POOL_ID" }, { status: 400 });
  }

  const admin = await getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "ADMIN_ROLE_REQUIRED" }, { status: admin ? 403 : 401 });
  }

  const parsed = shipmentStatusRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_SHIPMENT_STATUS" }, { status: 400 });
  }
  const requestedStatus = parsed.data.status;

  const pool = await prisma.coBuyPool.findUnique({
    where: { id: numericPoolId },
    select: { id: true, status: true, winningCarrierId: true }
  });

  if (!pool) {
    return NextResponse.json({ error: "POOL_NOT_FOUND" }, { status: 404 });
  }

  if (!isShipmentStatus(pool.status)) {
    return NextResponse.json({ error: "POOL_NOT_AWARDED" }, { status: 409 });
  }

  if (!pool.winningCarrierId) {
    return NextResponse.json({ error: "WINNING_CARRIER_REQUIRED" }, { status: 409 });
  }

  const nextStatus = nextShipmentStatus(pool.status);
  if (requestedStatus !== nextStatus) {
    return NextResponse.json({ error: "INVALID_SHIPMENT_TRANSITION", nextStatus }, { status: 409 });
  }

  const updatedPool = await prisma.coBuyPool.update({
    where: { id: pool.id },
    data: { status: requestedStatus }
  });

  await recordAuditLog({
    action: "SHIPMENT_STATUS_ADVANCE",
    actorId: admin.id,
    after: { id: updatedPool.id, status: updatedPool.status, winningCarrierId: updatedPool.winningCarrierId },
    before: pool,
    entityId: updatedPool.id,
    entityType: "CoBuyPool"
  });

  return NextResponse.json({
    poolId: updatedPool.id,
    status: updatedPool.status
  });
}

export async function POST(request: Request, context: { params: Promise<{ poolId: string }> }) {
  return PATCH(request, context);
}
