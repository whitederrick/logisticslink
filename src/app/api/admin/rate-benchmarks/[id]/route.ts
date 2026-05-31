import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rateBenchmarkSchema } from "@/lib/rate-benchmark-input";
import { recordAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

function parseBenchmarkId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function requireAdmin() {
  const admin = await getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return {
      response: NextResponse.json({ error: "ADMIN_ROLE_REQUIRED" }, { status: admin ? 403 : 401 }),
      user: null
    };
  }

  return { response: null, user: admin };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response, user: admin } = await requireAdmin();
  if (response) return response;

  const { id: idParam } = await params;
  const id = parseBenchmarkId(idParam);
  if (!id) {
    return NextResponse.json({ error: "INVALID_RATE_BENCHMARK_ID" }, { status: 400 });
  }

  const parsed = rateBenchmarkSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_RATE_BENCHMARK", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const validFrom = new Date(`${input.validFrom}T00:00:00.000Z`);

  const [before] = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      "benchmarkType", "confidenceScore", "containerGroup", "currency", "externalRef", "id", "podCode", "polCode",
      "provider", "rateUsd", "source", "sourceLabel", "sourceTier", "validFrom"
    FROM "FreightRateBenchmark"
    WHERE "id" = ${id}
  `;

  if (!before) {
    return NextResponse.json({ error: "RATE_BENCHMARK_NOT_FOUND" }, { status: 404 });
  }

  const [updated] = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    UPDATE "FreightRateBenchmark"
    SET "source" = ${input.source}::"RateBenchmarkSource",
        "sourceTier" = ${input.sourceTier}::"RateBenchmarkTier",
        "benchmarkType" = ${input.benchmarkType}::"RateBenchmarkType",
        "sourceLabel" = ${input.sourceLabel},
        "provider" = ${input.provider},
        "externalRef" = ${input.externalRef},
        "polCode" = ${input.polCode},
        "podCode" = ${input.podCode},
        "containerGroup" = ${input.containerGroup},
        "currency" = ${input.currency},
        "rateUsd" = ${input.rateUsd},
        "confidenceScore" = ${input.confidenceScore},
        "validFrom" = ${validFrom},
        "updatedAt" = NOW()
    WHERE "id" = ${id}
    RETURNING
      "benchmarkType", "confidenceScore", "containerGroup", "currency", "externalRef", "id", "podCode", "polCode",
      "provider", "rateUsd", "source", "sourceLabel", "sourceTier", "validFrom"
  `;

  await recordAuditLog({
    action: "RATE_BENCHMARK_UPDATE",
    actorId: admin?.id,
    after: updated,
    before,
    entityId: id,
    entityType: "FreightRateBenchmark"
  });

  return NextResponse.json({ status: "UPDATED" });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response, user: admin } = await requireAdmin();
  if (response) return response;

  const { id: idParam } = await params;
  const id = parseBenchmarkId(idParam);
  if (!id) {
    return NextResponse.json({ error: "INVALID_RATE_BENCHMARK_ID" }, { status: 400 });
  }

  const [deleted] = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    DELETE FROM "FreightRateBenchmark"
    WHERE "id" = ${id}
    RETURNING
      "benchmarkType", "confidenceScore", "containerGroup", "currency", "externalRef", "id", "podCode", "polCode",
      "provider", "rateUsd", "source", "sourceLabel", "sourceTier", "validFrom"
  `;

  if (!deleted) {
    return NextResponse.json({ error: "RATE_BENCHMARK_NOT_FOUND" }, { status: 404 });
  }

  await recordAuditLog({
    action: "RATE_BENCHMARK_DELETE",
    actorId: admin?.id,
    before: deleted,
    entityId: id,
    entityType: "FreightRateBenchmark"
  });

  return NextResponse.json({ status: "DELETED" });
}
