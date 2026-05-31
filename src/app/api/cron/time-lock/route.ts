import { NextResponse } from "next/server";
import { hasValidCronSecret } from "@/lib/cron-auth";
import { runGlobalTimelineBatch } from "@/lib/timeline";

export async function GET(request: Request) {
  if (!hasValidCronSecret(request)) {
    return NextResponse.json({ error: "CRON_SECRET_REQUIRED" }, { status: 401 });
  }

  const result = await runGlobalTimelineBatch();

  return NextResponse.json({
    ...result,
    executedAt: new Date().toISOString(),
    trigger: "cron"
  });
}

export async function POST(request: Request) {
  return GET(request);
}
