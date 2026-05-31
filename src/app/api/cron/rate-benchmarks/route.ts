import { NextResponse } from "next/server";
import { hasValidCronSecret } from "@/lib/cron-auth";
import { runRateBenchmarkCsvSync } from "@/lib/rate-benchmark-sync";
import { recordRateBenchmarkSyncAudit } from "@/lib/rate-benchmark-sync-audit";

export async function GET(request: Request) {
  if (!hasValidCronSecret(request)) {
    return NextResponse.json({ error: "CRON_SECRET_REQUIRED" }, { status: 401 });
  }

  const result = await runRateBenchmarkCsvSync();
  const executedAt = new Date().toISOString();

  await recordRateBenchmarkSyncAudit({ executedAt, result, trigger: "cron" });

  return NextResponse.json({
    ...result,
    executedAt,
    trigger: "cron"
  });
}

export async function POST(request: Request) {
  return GET(request);
}
