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
import { activeService } from "@/lib/product";

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
    quote.serviceCode === pool.serviceCode &&
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
    anonymousParticipants: "Anonymous participants",
    createPool: "Create pool",
    emptyQuotes: "No quotes yet.",
    guide: "Guide rate",
    joinWithQuote: (id: number) => `Join with quote #${id}`,
    marketTitle: "Aggregated market view",
    matched: "Matched",
    pool: "Pool",
    quote: "Quote",
    quoteTitle: "Forwarder quotes",
    subtitle: "Forwarders can submit customer cargo under their own account while other participant identities remain hidden.",
    title: "Forwarder workspace",
    to: "to"
  },
  ko: {
    aggregated: "집계 물량",
    anonymousParticipants: "익명 참여자",
    createPool: "새 풀 생성",
    emptyQuotes: "아직 생성한 견적이 없습니다.",
    guide: "가이드 운임",
    joinWithQuote: (id: number) => `견적 #${id}로 참여`,
    marketTitle: "공동구매 시장 현황",
    matched: "매칭 완료",
    pool: "풀",
    quote: "견적",
    quoteTitle: "포워더 견적",
    subtitle: "포워더는 고객 화물을 자기 계정으로 제출하고, 다른 참여자의 신원은 볼 수 없습니다.",
    title: "포워더 워크스페이스",
    to: "→"
  }
} as const;

export default async function ForwarderPage({ searchParams }: { searchParams: PageSearchParams }) {
  const language = await getPageLanguage(searchParams);
  const t = text[language];
  const user = await requireUserRole(["FORWARDER"], language);

  if (!isOperationalUser(user)) {
    return (
      <AppShell active="/forwarder" language={language} title={t.title} subtitle={t.subtitle}>
        <AccountStatusNotice language={language} status={user.status} />
      </AppShell>
    );
  }

  const [quotes, availablePools, shipmentPools] = await Promise.all([
    prisma.quote.findMany({
      where: { requesterId: user.id, serviceCode: activeService.code },
      include: { participants: { include: { pool: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.coBuyPool.findMany({
      where: { serviceCode: activeService.code, status: "AGGREGATING" },
      include: { participants: true },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.coBuyPool.findMany({
      where: {
        serviceCode: activeService.code,
        OR: [{ createdById: user.id }, { participants: { some: { userId: user.id } } }],
        status: { in: ["AWARDED", "IN_SHIPMENT", "COMPLETED"] }
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
    <AppShell active="/forwarder" language={language} title={t.title} subtitle={t.subtitle}>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <QuoteCreateForm language={language} requesterId={user.id} />

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{t.quoteTitle}</h2>
          <div className="mt-4 space-y-3">
            {quotes.length === 0 ? <p className="text-sm text-slate-500">{t.emptyQuotes}</p> : null}
            {quotes.map((quote) => (
              <div className="rounded-md border border-slate-200 p-4" key={quote.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {t.quote} #{quote.id}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {quote.polCode} {t.to} {quote.podCode} / {dateOnly(quote.targetEtd)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge language={language} value={quote.status} />
                      <p className="text-sm text-slate-500">
                        {t.guide} {money(quote.guideRateUsd)}
                      </p>
                    </div>
                  </div>
                  {quote.participants.length === 0 ? (
                    <ActionButton body={{ quoteId: quote.id, scfiBaseRateUsd: Number(quote.guideRateUsd ?? 3200) }} url="/api/pools">
                      {t.createPool}
                    </ActionButton>
                  ) : (
                    <p className="rounded bg-teal-50 px-2 py-1 text-sm font-medium text-harbor">{t.matched}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t.marketTitle}</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {availablePools.map((pool) => (
            <div className="rounded-md border border-slate-200 p-4" key={pool.id}>
              <p className="font-semibold">
                {t.pool} #{pool.id}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {pool.polCode} {t.to} {pool.podCode} / {pool.containerType ?? "LCL"} / ETD {dateOnly(pool.targetEtd)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {t.aggregated} {Number(pool.totalVolumeTeu)} TEU / {t.anonymousParticipants} {pool.participants.length}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {quotes.filter((quote) => quoteMatchesPool(quote, pool)).map((quote) => (
                  <ActionButton body={{ quoteId: quote.id }} key={quote.id} url={`/api/pools/${pool.id}/join`}>
                    {t.joinWithQuote(quote.id)}
                  </ActionButton>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <ShipmentFollowupBoard language={language} shipments={shipmentFollowups} />
    </AppShell>
  );
}
