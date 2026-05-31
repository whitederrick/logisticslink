import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordRateBenchmarkSyncAudit } from "@/lib/rate-benchmark-sync-audit";
import { runRateBenchmarkCsvSync } from "@/lib/rate-benchmark-sync";

export async function POST() {
  const admin = await getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "ADMIN_ROLE_REQUIRED" }, { status: admin ? 403 : 401 });
  }

  const result = await runRateBenchmarkCsvSync();
  const executedAt = new Date().toISOString();

  await recordRateBenchmarkSyncAudit({ actorId: admin.id, executedAt, result, trigger: "admin" });

  return NextResponse.json({
    ...result,
    executedAt,
    trigger: "admin"
  });
}
