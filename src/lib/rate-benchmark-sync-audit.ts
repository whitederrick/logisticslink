import { recordAuditLog } from "@/lib/audit-log";
import { RateBenchmarkSyncResult } from "@/lib/rate-benchmark-sync";

export function rateBenchmarkSyncAction(result: Pick<RateBenchmarkSyncResult, "errors">) {
  return result.errors.length > 0 ? "RATE_BENCHMARK_SYNC_FAILED" : "RATE_BENCHMARK_SYNC";
}

export async function recordRateBenchmarkSyncAudit({
  actorId = null,
  executedAt,
  result,
  trigger
}: {
  actorId?: number | null;
  executedAt: string;
  result: RateBenchmarkSyncResult;
  trigger: "admin" | "cron";
}) {
  await recordAuditLog({
    action: rateBenchmarkSyncAction(result),
    actorId,
    after: { ...result, executedAt, trigger },
    entityType: "FreightRateBenchmark"
  });
}
