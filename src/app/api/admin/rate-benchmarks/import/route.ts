import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseRateBenchmarkCsv } from "@/lib/rate-benchmark-input";
import { recordAuditLog } from "@/lib/audit-log";
import { upsertRateBenchmarks } from "@/lib/rate-benchmark-store";

export async function POST(request: Request) {
  const admin = await getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "ADMIN_ROLE_REQUIRED" }, { status: admin ? 403 : 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV_FILE_REQUIRED" }, { status: 400 });
  }

  const parsed = parseRateBenchmarkCsv(await file.text());

  if (!parsed.ok) {
    return NextResponse.json({ error: "INVALID_RATE_BENCHMARK_CSV", issues: parsed.errors }, { status: 400 });
  }

  const rates = await upsertRateBenchmarks(parsed.rows);

  await recordAuditLog({
    action: "RATE_BENCHMARK_IMPORT",
    actorId: admin.id,
    after: {
      fileName: file.name,
      imported: rates.length,
      rateIds: rates.map((rate) => rate.id),
      sources: Array.from(new Set(rates.map((rate) => rate.source)))
    },
    entityType: "FreightRateBenchmark"
  });

  return NextResponse.json({ imported: parsed.rows.length, status: "IMPORTED" }, { status: 201 });
}
