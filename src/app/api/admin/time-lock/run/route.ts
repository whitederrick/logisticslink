import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit-log";
import { runGlobalTimelineBatch } from "@/lib/timeline";

export async function POST() {
  const admin = await getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "ADMIN_ROLE_REQUIRED" }, { status: admin ? 403 : 401 });
  }

  const result = await runGlobalTimelineBatch();

  await recordAuditLog({
    action: "TIMELINE_BATCH_RUN",
    actorId: admin.id,
    after: result,
    entityType: "CoBuyPool"
  });

  return NextResponse.json(result);
}
