import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rateBenchmarkSchema } from "@/lib/rate-benchmark-input";
import { recordAuditLog } from "@/lib/audit-log";
import { upsertRateBenchmark } from "@/lib/rate-benchmark-store";

export async function POST(request: Request) {
  const admin = await getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "ADMIN_ROLE_REQUIRED" }, { status: admin ? 403 : 401 });
  }

  const parsed = rateBenchmarkSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_RATE_BENCHMARK", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const rate = await upsertRateBenchmark(parsed.data);

  await recordAuditLog({
    action: "RATE_BENCHMARK_UPSERT",
    actorId: admin.id,
    after: rate,
    entityId: rate.id,
    entityType: "FreightRateBenchmark"
  });

  return NextResponse.json({ status: "SAVED" }, { status: 201 });
}
