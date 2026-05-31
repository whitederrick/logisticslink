import { AccountStatusNotice } from "@/components/account-status-notice";
import { AppShell } from "@/components/app-shell";
import { CarrierAuctionBoard } from "@/components/carrier-auction-board";
import { ShipmentFollowupBoard } from "@/components/shipment-followup-board";
import { StatusBadge } from "@/components/status-badge";
import { isOperationalUser, requireUserRole } from "@/lib/auth";
import { getPageLanguage, PageSearchParams } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getAvailableRateBenchmarks } from "@/lib/rate-benchmark";

const text = {
  en: {
    availableAuctions: "Available auctions",
    carrierStatus: "Account status",
    subtitle: "Review auction-ready cargo pools and compete on freight price without seeing shipper identities.",
    title: "Reverse auction board",
    trustScore: "Trust score"
  },
  ko: {
    availableAuctions: "진행 가능 경매",
    carrierStatus: "계정 상태",
    subtitle: "경매 상태의 화물 풀을 확인하고, 화주 신원 없이 운임 가격으로 경쟁합니다.",
    title: "역경매 보드",
    trustScore: "신뢰 점수"
  }
} as const;

export default async function CarrierPage({ searchParams }: { searchParams: PageSearchParams }) {
  const language = await getPageLanguage(searchParams);
  const t = text[language];
  const carrier = await requireUserRole(["CARRIER"], language);

  if (!isOperationalUser(carrier)) {
    return (
      <AppShell active="/carrier" language={language} title={t.title} subtitle={t.subtitle}>
        <AccountStatusNotice language={language} status={carrier.status} />
      </AppShell>
    );
  }

  const [auctionPools, myBids, shipmentPools] = await Promise.all([
    prisma.coBuyPool.findMany({
      where: { status: "AUCTION" },
      include: {
        bids: { orderBy: [{ proposedRateUsd: "asc" }, { bidTime: "asc" }], take: 1 },
        _count: { select: { bids: true, participants: true } }
      },
      orderBy: { auctionEndUtc: "asc" },
      take: 12
    }),
    prisma.auctionBid.findMany({
      where: { carrierId: carrier.id },
      include: { pool: true },
      orderBy: { bidTime: "desc" },
      take: 8
    }),
    prisma.coBuyPool.findMany({
      where: {
        status: { in: ["AWARDED", "SHIPMENT_IN_PROGRESS", "COMPLETED"] },
        winningCarrierId: carrier.id
      },
      include: { participants: true, winningCarrier: true },
      orderBy: { updatedAt: "desc" },
      take: 8
    })
  ]);

  const initialAuctionPools = await Promise.all(
    auctionPools.map(async (pool) => ({
      auctionEndUtc: pool.auctionEndUtc.toISOString(),
      bidCount: pool._count.bids,
      containerType: pool.containerType,
      currentLowestRateUsd: pool.bids[0] ? Number(pool.bids[0].proposedRateUsd) : null,
      participantCount: pool._count.participants,
      podCode: pool.podCode,
      polCode: pool.polCode,
      poolId: pool.id,
      rateBenchmarks: await getAvailableRateBenchmarks({
        containerType: pool.containerType,
        isReefer: pool.isReefer,
        podCode: pool.podCode,
        polCode: pool.polCode
      }),
      scfiBaseRateUsd: Number(pool.scfiBaseRateUsd),
      targetEtd: pool.targetEtd.toISOString()
    }))
  );

  const initialData = {
    auctionPools: initialAuctionPools,
    myBids: myBids.map((bid) => ({
      bidId: bid.id,
      isWinningAtTime: bid.isWinningAtTime,
      podCode: bid.pool.podCode,
      polCode: bid.pool.polCode,
      poolId: bid.poolId,
      proposedRateUsd: Number(bid.proposedRateUsd)
    })),
    refreshedAt: new Date().toISOString()
  };

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
    <AppShell active="/carrier" language={language} title={t.title} subtitle={t.subtitle}>
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{t.carrierStatus}</p>
          <div className="mt-3">
            <StatusBadge language={language} value={carrier.status} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{t.trustScore}</p>
          <p className="mt-2 text-2xl font-semibold">{carrier.trustScore}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{t.availableAuctions}</p>
          <p className="mt-2 text-2xl font-semibold">{auctionPools.length}</p>
        </div>
      </section>

      <CarrierAuctionBoard initialData={initialData} language={language} />
      <ShipmentFollowupBoard language={language} shipments={shipmentFollowups} />
    </AppShell>
  );
}
