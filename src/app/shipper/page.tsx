import { ActionButton } from "@/components/action-button";
import { AccountStatusNotice } from "@/components/account-status-notice";
import { AppShell } from "@/components/app-shell";
import { QuoteCreateForm } from "@/components/quote-create-form";
import { ShipmentFollowupBoard } from "@/components/shipment-followup-board";
import { StatusBadge } from "@/components/status-badge";
import { isOperationalUser, requireUserRole } from "@/lib/auth";
import { dateOnly, money } from "@/lib/format";
import { getPageLanguage, PageSearchParams } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

type QuoteForPool = Awaited<ReturnType<typeof prisma.quote.findMany>>[number] & {
  participants: Array<{ pool: unknown }>;
};

type PoolForBoard = Awaited<ReturnType<typeof prisma.coBuyPool.findMany>>[number] & {
  participants: unknown[];
};

function quoteMatchesPool(quote: QuoteForPool, pool: PoolForBoard) {
  const dayMs = 24 * 60 * 60 * 1000;
  const etdDiffDays = Math.abs(Math.round((quote.targetEtd.getTime() - pool.targetEtd.getTime()) / dayMs));

  return (
    quote.participants.length === 0 &&
    quote.polCode === pool.polCode &&
    quote.podCode === pool.podCode &&
    quote.cargoType === pool.cargoType &&
    quote.containerType === pool.containerType &&
    quote.isHeavy === pool.isHeavy &&
    quote.isHazardous === pool.isHazardous &&
    quote.isReefer === pool.isReefer &&
    etdDiffDays <= 3
  );
}

const text = {
  en: {
    aggregated: "Aggregated volume",
    boardDescription: "Only route, schedule, aggregate volume, and pool status are visible.",
    boardTitle: "Blind co-buy board",
    createPool: "Create pool",
    emptyQuotes: "No quotes yet.",
    guide: "Guide rate",
    joinWithQuote: (id: number) => `Join with quote #${id}`,
    myQuotes: "My cargo quotes",
    participants: "Participants",
    pool: "Pool",
    quote: "Quote",
    subtitle: "Register cargo demand, join blind co-buy pools, and track only your own quotes and participation records.",
    title: "Cargo demand workspace",
    to: "to"
  },
  ko: {
    aggregated: "집계 물량",
    boardDescription: "항로, 일정, 총 집계 물량, 풀 상태만 표시합니다. 개별 회사명과 상세 화물 정보는 숨깁니다.",
    boardTitle: "블라인드 공동구매 현황",
    createPool: "새 풀 생성",
    emptyQuotes: "아직 생성한 견적이 없습니다.",
    guide: "가이드 운임",
    joinWithQuote: (id: number) => `견적 #${id}로 참여`,
    myQuotes: "내 화물 견적",
    participants: "참여자",
    pool: "풀",
    quote: "견적",
    subtitle: "화물 수요를 등록하고 블라인드 공동구매 풀에 참여하며, 내 견적과 참여 기록만 확인합니다.",
    title: "화물 등록 워크스페이스",
    to: "→"
  }
} as const;

export default async function ShipperPage({ searchParams }: { searchParams: PageSearchParams }) {
  const language = await getPageLanguage(searchParams);
  const t = text[language];
  const user = await requireUserRole(["SHIPPER"], language);

  if (!isOperationalUser(user)) {
    return (
      <AppShell active="/shipper" language={language} title={t.title} subtitle={t.subtitle}>
        <AccountStatusNotice language={language} status={user.status} />
      </AppShell>
    );
  }

  const [quotes, openPools, shipmentPools] = await Promise.all([
    prisma.quote.findMany({
      where: { requesterId: user.id },
      include: { participants: { include: { pool: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.coBuyPool.findMany({
      where: { status: "AGGREGATING" },
      include: { participants: true },
      orderBy: { auctionStartUtc: "asc" },
      take: 8
    }),
    prisma.coBuyPool.findMany({
      where: {
        participants: { some: { userId: user.id } },
        status: { in: ["AWARDED", "SHIPMENT_IN_PROGRESS", "COMPLETED"] }
      },
      include: { participants: true, winningCarrier: true },
      orderBy: { updatedAt: "desc" },
      take: 8
    })
  ]);

  const shipmentFollowups = shipmentPools.map((pool) => ({
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
    <AppShell active="/shipper" language={language} title={t.title} subtitle={t.subtitle}>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <QuoteCreateForm language={language} requesterId={user.id} />

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{t.myQuotes}</h2>
          <div className="mt-4 space-y-3">
            {quotes.length === 0 ? <p className="text-sm text-slate-500">{t.emptyQuotes}</p> : null}
            {quotes.map((quote) => {
              const pool = quote.participants[0]?.pool;
              return (
                <div className="rounded-md border border-slate-200 p-4" key={quote.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {t.quote} #{quote.id}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {quote.polCode} {t.to} {quote.podCode} / {dateOnly(quote.targetEtd)} / {quote.containerType ?? "LCL"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge language={language} value={quote.status} />
                        <p className="text-sm text-slate-500">
                          {t.guide} {money(quote.guideRateUsd)}
                        </p>
                      </div>
                    </div>
                    {pool == null ? (
                      <ActionButton body={{ quoteId: quote.id, scfiBaseRateUsd: Number(quote.guideRateUsd ?? 3200) }} url="/api/pools">
                        {t.createPool}
                      </ActionButton>
                    ) : (
                      <p className="rounded bg-teal-50 px-2 py-1 text-sm font-medium text-harbor">
                        {t.pool} #{pool.id}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t.boardTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.boardDescription}</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {openPools.map((pool) => {
            const targetTeu = 50;
            const totalTeu = Number(pool.totalVolumeTeu);
            const fill = Math.min(100, Math.round((totalTeu / targetTeu) * 100));
            return (
              <div className="rounded-md border border-slate-200 p-4" key={pool.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {t.pool} #{pool.id}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {pool.polCode} {t.to} {pool.podCode} / {dateOnly(pool.targetEtd)} / {pool.containerType ?? "LCL"}
                    </p>
                  </div>
                  <StatusBadge language={language} value={pool.status} />
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded bg-slate-100">
                  <div className="h-full bg-harbor" style={{ width: `${fill}%` }} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {t.aggregated} {totalTeu} / {targetTeu} TEU / {t.participants} {pool.participants.length}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {quotes.filter((quote) => quoteMatchesPool(quote, pool)).map((quote) => (
                    <ActionButton body={{ quoteId: quote.id }} key={quote.id} url={`/api/pools/${pool.id}/join`}>
                      {t.joinWithQuote(quote.id)}
                    </ActionButton>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ShipmentFollowupBoard language={language} shipments={shipmentFollowups} />
    </AppShell>
  );
}
