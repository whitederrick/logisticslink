import { ActionButton } from "@/components/action-button";
import { AppShell } from "@/components/app-shell";
import { AuditLogTable } from "@/components/audit-log-table";
import { RateBenchmarkForm } from "@/components/rate-benchmark-form";
import { RateBenchmarkImportForm } from "@/components/rate-benchmark-import-form";
import { RateBenchmarkTable } from "@/components/rate-benchmark-table";
import { ShipmentFollowupBoard } from "@/components/shipment-followup-board";
import { StatusBadge } from "@/components/status-badge";
import { UserAccessTable } from "@/components/user-access-table";
import { requireUserRole } from "@/lib/auth";
import { dateOnly, money } from "@/lib/format";
import { PageSearchParams, resolveLanguage } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { activeService } from "@/lib/product";
import type { Prisma } from "@prisma/client";

const text = {
  en: {
    aggregateVolume: "Aggregate volume",
    auction: "Auction",
    auditApply: "Apply period",
    auditFrom: "From",
    auditTitle: "Pools and access audit",
    auditLogDescription: "Recent administrative changes and batch executions are retained for operating review.",
    auditLogTitle: "Operational audit log",
    auditNext: "Next",
    auditPage: "Page",
    auditPrev: "Previous",
    auditTo: "To",
    batchDescription: "Moves D-14 pools to auction and resolves D-7 auction outcomes.",
    batchTitle: "Global time-lock batch",
    bids: "Carrier bids",
    closeAuction: "Close auction",
    currentLowest: "current lowest",
    emptyBids: "No bids.",
    emptyAuditLogs: "No audit logs yet.",
    emptyPools: "No pools yet.",
    emptyRates: "No rate benchmarks have been collected yet.",
    outbid: "outbid",
    participantsAdminOnly: "Participants visible to admin only",
    pool: "Pool",
    quote: "Quote",
    rateAudit: "Freight rate benchmark audit",
    rateSyncDescription: "Fetches configured CSV sources such as SCFI, carrier FAK, and public tariffs.",
    rateSyncTitle: "Configured rate source sync",
    route: "Route",
    runBatch: "Run batch",
    runRateSync: "Sync rates",
    source: "Source",
    startAuction: "Start auction",
    subtitle: "Admins can inspect full operational data, run time-lock transitions, and validate auction ceilings against multiple freight sources.",
    title: "Admin control room",
    to: "to",
    userAccessDescription: "Approve new companies and restrict accounts that should not participate in quotes or auctions.",
    userAccessTitle: "Company access control",
    validFrom: "Valid from",
    winningCarrier: "Winning carrier"
  },
  ko: {
    aggregateVolume: "총 집계 물량",
    auction: "경매",
    auditApply: "기간 적용",
    auditFrom: "시작일",
    auditTitle: "풀 및 접근 감사",
    auditLogDescription: "관리자 조작과 배치 실행 이력을 운영 검토용으로 보존합니다.",
    auditLogTitle: "운영 감사 로그",
    auditNext: "다음",
    auditPage: "페이지",
    auditPrev: "이전",
    auditTo: "종료일",
    batchDescription: "D-14 풀을 역경매로 전환하고, D-7이 지난 경매 결과를 낙찰 또는 실패로 정리합니다.",
    batchTitle: "글로벌 타임락 배치",
    bids: "선사 입찰",
    closeAuction: "경매 마감",
    currentLowest: "현재 최저가",
    emptyBids: "입찰 없음",
    emptyAuditLogs: "아직 감사 로그가 없습니다.",
    emptyPools: "아직 생성된 풀이 없습니다.",
    emptyRates: "아직 수집된 운임 기준이 없습니다.",
    outbid: "상회 입찰",
    participantsAdminOnly: "관리자만 볼 수 있는 참여자 정보",
    pool: "풀",
    quote: "견적",
    rateAudit: "운임 기준 데이터 감사",
    rateSyncDescription: "설정된 CSV 소스에서 SCFI, 선사 FAK, 공시 운임 데이터를 가져옵니다.",
    rateSyncTitle: "설정 운임 소스 동기화",
    route: "항로",
    runBatch: "배치 실행",
    runRateSync: "운임 동기화",
    source: "출처",
    startAuction: "경매 시작",
    subtitle: "전체 운영 데이터, 타임락 전환, 역경매 상한가가 여러 운임 기준으로 검증되는지 확인합니다.",
    title: "관리자 컨트롤룸",
    to: "→",
    userAccessDescription: "신규 업체를 승인하고 견적/경매 참여가 부적절한 계정을 제한합니다.",
    userAccessTitle: "업체 접근 제어",
    validFrom: "적용일",
    winningCarrier: "낙찰 선사"
  }
} as const;

const auditPageSize = 10;

const roleLabels = {
  en: { ADMIN: "Admin", CARRIER: "Carrier", FORWARDER: "Forwarder", SHIPPER: "Shipper" },
  ko: { ADMIN: "관리자", CARRIER: "선사", FORWARDER: "포워더", SHIPPER: "화주" }
} as const;

function searchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateInputValue(value: string | string[] | undefined) {
  const raw = searchParamValue(value);
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function positivePage(value: string | string[] | undefined) {
  const raw = Number(searchParamValue(value));
  return Number.isInteger(raw) && raw > 0 ? raw : 1;
}

function startOfUtcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfUtcDate(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}

export default async function AdminPage({ searchParams }: { searchParams: PageSearchParams }) {
  const params = await searchParams;
  const language = resolveLanguage(params.lang);
  const t = text[language];
  const admin = await requireUserRole(["ADMIN"], language);
  const auditFrom = dateInputValue(params.auditFrom);
  const auditTo = dateInputValue(params.auditTo);
  const auditPage = positivePage(params.auditPage);
  const auditWhere: Prisma.AuditLogWhereInput = {};

  if (auditFrom || auditTo) {
    auditWhere.createdAt = {
      ...(auditFrom ? { gte: startOfUtcDate(auditFrom) } : {}),
      ...(auditTo ? { lte: endOfUtcDate(auditTo) } : {})
    };
  }

  function auditPageHref(page: number) {
    const query = new URLSearchParams();
    query.set("lang", language);
    query.set("auditPage", String(page));
    if (auditFrom) query.set("auditFrom", auditFrom);
    if (auditTo) query.set("auditTo", auditTo);
    return `/admin?${query.toString()}`;
  }

  const auditLogCount = await prisma.auditLog.count({ where: auditWhere });
  const totalAuditPages = Math.max(1, Math.ceil(auditLogCount / auditPageSize));
  const currentAuditPage = Math.min(auditPage, totalAuditPages);

  const [users, pools, rateBenchmarks, auditLogs] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ role: "asc" }, { id: "asc" }] }),
    prisma.coBuyPool.findMany({
      where: { serviceCode: activeService.code },
      include: {
        participants: { include: { user: true, quote: true } },
        bids: { include: { carrier: true }, orderBy: [{ proposedRateUsd: "asc" }, { bidTime: "asc" }] },
        winningCarrier: true
      },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.$queryRaw<
      Array<{
        benchmarkType: string;
        confidenceScore: number;
        containerGroup: string;
        currency: string;
        externalRef: string | null;
        id: number;
        podCode: string;
        polCode: string;
        provider: string | null;
        rateUsd: unknown;
        source: string;
        sourceLabel: string;
        sourceTier: string;
        validFrom: Date;
      }>
    >`
      SELECT
        "benchmarkType", "confidenceScore", "containerGroup", "currency", "externalRef", "id", "podCode", "polCode",
        "provider", "rateUsd", "source", "sourceLabel", "sourceTier", "validFrom"
      FROM "FreightRateBenchmark"
      ORDER BY "collectedAt" DESC, "polCode" ASC, "podCode" ASC
      LIMIT 12
    `,
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (currentAuditPage - 1) * auditPageSize,
      take: auditPageSize,
      where: auditWhere
    })
  ]);

  const usersById = new Map(users.map((user) => [user.id, user]));

  const shipmentFollowups = pools
    .filter((pool) => ["AWARDED", "IN_SHIPMENT", "COMPLETED"].includes(pool.status))
    .map((pool) => ({
      finalRateUsd: pool.finalRateUsd == null ? null : Number(pool.finalRateUsd),
      participantCount: pool.participants.length,
      podCode: pool.podCode,
      polCode: pool.polCode,
      poolId: pool.id,
      status: pool.status,
      targetEtd: pool.targetEtd,
      totalVolumeTeu: Number(pool.totalVolumeTeu),
      winningCarrierName: pool.winningCarrier?.companyNameEn ?? null
    }));

  return (
    <AppShell active="/admin" language={language} title={t.title} subtitle={t.subtitle}>
      <section className="grid gap-4 md:grid-cols-4">
        {(["SHIPPER", "FORWARDER", "CARRIER", "ADMIN"] as const).map((role) => (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={role}>
            <p className="text-sm text-slate-500">{roleLabels[language][role]}</p>
            <p className="mt-2 text-2xl font-semibold">{users.filter((user) => user.role === role).length}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t.userAccessTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.userAccessDescription}</p>
        <UserAccessTable adminId={admin.id} language={language} users={users} />
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t.batchTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.batchDescription}</p>
          </div>
          <ActionButton body={{ adminId: admin.id }} url="/api/admin/time-lock/run">
            {t.runBatch}
          </ActionButton>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t.rateAudit}</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div>
            <p className="text-sm font-semibold">{t.rateSyncTitle}</p>
            <p className="mt-1 text-sm text-slate-500">{t.rateSyncDescription}</p>
          </div>
          <ActionButton url="/api/admin/rate-benchmarks/sync">{t.runRateSync}</ActionButton>
        </div>
        <RateBenchmarkForm language={language} />
        <RateBenchmarkImportForm language={language} />
        {rateBenchmarks.length === 0 ? <p className="mt-4 text-sm text-slate-500">{t.emptyRates}</p> : null}
        {rateBenchmarks.length > 0 ? (
          <RateBenchmarkTable
            language={language}
            rates={rateBenchmarks.map((rate) => ({
              ...rate,
              rateUsd: Number(rate.rateUsd),
              validFrom: dateOnly(rate.validFrom)
            }))}
          />
        ) : null}
      </section>

      <ShipmentFollowupBoard canAdvance language={language} shipments={shipmentFollowups} />

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t.auditLogTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.auditLogDescription}</p>
        <form className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_1fr_auto]" method="get">
          <input name="lang" type="hidden" value={language} />
          <input name="auditPage" type="hidden" value="1" />
          <label className="grid gap-1 text-sm text-slate-600">
            {t.auditFrom}
            <input className="h-10 rounded-md border border-slate-300 px-3" defaultValue={auditFrom} name="auditFrom" type="date" />
          </label>
          <label className="grid gap-1 text-sm text-slate-600">
            {t.auditTo}
            <input className="h-10 rounded-md border border-slate-300 px-3" defaultValue={auditTo} name="auditTo" type="date" />
          </label>
          <div className="flex items-end">
            <button className="h-10 rounded-md bg-ink px-4 text-sm font-medium text-white" type="submit">
              {t.auditApply}
            </button>
          </div>
        </form>
        {auditLogs.length === 0 ? <p className="mt-4 text-sm text-slate-500">{t.emptyAuditLogs}</p> : null}
        {auditLogs.length > 0 ? (
          <AuditLogTable
            language={language}
            logs={auditLogs.map((log) => {
              const actor = log.actorId ? usersById.get(log.actorId) : null;

              return {
                action: log.action,
                actorName: actor?.companyNameEn ?? (language === "ko" ? "시스템" : "System"),
                afterJson: log.afterJson && typeof log.afterJson === "object" && !Array.isArray(log.afterJson) ? log.afterJson : null,
                beforeJson: log.beforeJson && typeof log.beforeJson === "object" && !Array.isArray(log.beforeJson) ? log.beforeJson : null,
                createdAt: log.createdAt.toISOString(),
                entityId: log.entityId,
                entityType: log.entityType,
                id: log.id
              };
            })}
          />
        ) : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            {t.auditPage} {currentAuditPage} / {totalAuditPages}
          </p>
          <div className="flex gap-2">
            {currentAuditPage > 1 ? (
              <a className="rounded-md border border-slate-300 px-3 py-2" href={auditPageHref(currentAuditPage - 1)}>
                {t.auditPrev}
              </a>
            ) : null}
            {currentAuditPage < totalAuditPages ? (
              <a className="rounded-md border border-slate-300 px-3 py-2" href={auditPageHref(currentAuditPage + 1)}>
                {t.auditNext}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t.auditTitle}</h2>
        <div className="mt-4 space-y-4">
          {pools.length === 0 ? <p className="text-sm text-slate-500">{t.emptyPools}</p> : null}
          {pools.map((pool) => (
            <div className="rounded-md border border-slate-200 p-4" key={pool.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {t.pool} #{pool.id}
                    </p>
                    <StatusBadge language={language} value={pool.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {pool.polCode} {t.to} {pool.podCode} / {dateOnly(pool.targetEtd)} / {pool.containerType ?? "LCL"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {t.auction} {pool.auctionStartUtc.toISOString()} {t.to} {pool.auctionEndUtc.toISOString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pool.status === "AGGREGATING" ? (
                    <ActionButton body={{ adminId: admin.id }} url={`/api/admin/pools/${pool.id}/start-auction`}>
                      {t.startAuction}
                    </ActionButton>
                  ) : null}
                  {pool.status === "AUCTION_LIVE" ? (
                    <ActionButton body={{ adminId: admin.id }} url={`/api/admin/pools/${pool.id}/close-auction`}>
                      {t.closeAuction}
                    </ActionButton>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div className="rounded bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{t.aggregateVolume}</p>
                  <p className="mt-1 font-semibold">{Number(pool.totalVolumeTeu)} TEU</p>
                </div>
                <div className="rounded bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{language === "ko" ? "적용 상한 / 최종" : "Ceiling / final"}</p>
                  <p className="mt-1 font-semibold">
                    {money(pool.scfiBaseRateUsd)} / {money(pool.finalRateUsd)}
                  </p>
                </div>
                <div className="rounded bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{t.winningCarrier}</p>
                  <p className="mt-1 font-semibold">{pool.winningCarrier?.companyNameEn ?? "-"}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold">{t.participantsAdminOnly}</p>
                  <div className="mt-2 space-y-2">
                    {pool.participants.map((participant) => (
                      <p className="rounded bg-slate-50 px-3 py-2 text-sm text-slate-600" key={participant.id}>
                        {roleLabels[language][participant.user.role]} / {participant.user.companyNameEn} / {t.quote} #{participant.quoteId} /{" "}
                        {Number(participant.volumeTeu)} TEU
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.bids}</p>
                  <div className="mt-2 space-y-2">
                    {pool.bids.length === 0 ? <p className="text-sm text-slate-500">{t.emptyBids}</p> : null}
                    {pool.bids.map((bid) => (
                      <p className="rounded bg-slate-50 px-3 py-2 text-sm text-slate-600" key={bid.id}>
                        {bid.carrier.companyNameEn} / {money(bid.proposedRateUsd)} /{" "}
                        {bid.isWinningAtTime ? t.currentLowest : t.outbid}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
