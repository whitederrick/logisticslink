import { NextResponse } from "next/server";
import { parsePositiveRouteId, userStatusRequestSchema } from "@/lib/api-contract";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  const numericUserId = parsePositiveRouteId(userId);

  if (!numericUserId) {
    return NextResponse.json({ error: "INVALID_USER_ID" }, { status: 400 });
  }

  const admin = await getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "ADMIN_ROLE_REQUIRED" }, { status: admin ? 403 : 401 });
  }

  if (admin.id === numericUserId) {
    return NextResponse.json({ error: "ADMIN_SELF_STATUS_CHANGE_BLOCKED" }, { status: 409 });
  }

  const parsed = userStatusRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_USER_STATUS" }, { status: 400 });
  }

  const before = await prisma.user.findUnique({
    where: { id: numericUserId },
    select: {
      businessNumber: true,
      companyNameEn: true,
      email: true,
      id: true,
      role: true,
      status: true
    }
  });

  if (!before) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: before.id },
    data: { status: parsed.data.status },
    select: {
      businessNumber: true,
      companyNameEn: true,
      email: true,
      id: true,
      role: true,
      status: true
    }
  });

  await recordAuditLog({
    action: "USER_STATUS_UPDATE",
    actorId: admin.id,
    after: {
      ...updatedUser,
      reason: parsed.data.reason ?? null
    },
    before,
    entityId: updatedUser.id,
    entityType: "User"
  });

  return NextResponse.json({
    status: updatedUser.status,
    userId: updatedUser.id
  });
}

export async function POST(request: Request, context: { params: Promise<{ userId: string }> }) {
  return PATCH(request, context);
}
