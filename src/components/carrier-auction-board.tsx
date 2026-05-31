"use client";

import { Language } from "@/lib/i18n";
import { Gavel, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type RateBenchmark = {
  rateUsd: number;
  source: string;
  sourceLabel: string;
  validFrom: string;
  collectedAt?: string;
};

type AuctionPool = {
  auctionEndUtc: string;
  bidCount: number;
  containerType: string | null;
  currentLowestRateUsd: number | null;
  participantCount: number;
  podCode: string;
  polCode: string;
  poolId: number;
  rateBenchmarks: RateBenchmark[];
  scfiBaseRateUsd: number;
  targetEtd: string;
};

type MyBid = {
  bidId: number;
  isWinningAtTime: boolean;
  podCode: string;
  polCode: string;
  poolId: number;
  proposedRateUsd: number;
};

type LiveAuctionPayload = {
  auctionPools: AuctionPool[];
  myBids: MyBid[];
  refreshedAt: string;
};

const text = {
  en: {
    appliedCeiling: "Applied ceiling",
    bid50Lower: "Bid 50 lower",
    bidCount: "Bid count",
    bidLedger: "My bid ledger",
    collected: "Collected",
    currentLowest: "Current lowest",
    emptyAuctions: "No pools are in auction right now.",
    emptyBids: "No bids yet.",
    liveAuctions: "Live reverse auctions",
    outbid: "Outbid",
    participants: "Participants",
    pool: "Pool",
    rateChecks: "Rate benchmark checks",
    refreshed: "Updated",
    routeArrow: "to",
    submitting: "Submitting..."
  },
  ko: {
    appliedCeiling: "적용 상한가",
    bid50Lower: "50달러 낮게 입찰",
    bidCount: "입찰 수",
    bidLedger: "내 입찰 원장",
    collected: "수집",
    currentLowest: "현재 최저가",
    emptyAuctions: "현재 진행 중인 역경매 풀이 없습니다.",
    emptyBids: "아직 입찰 내역이 없습니다.",
    liveAuctions: "실시간 역경매",
    outbid: "상회 입찰",
    participants: "참여자",
    pool: "풀",
    rateChecks: "운임 기준 멀티 확인",
    refreshed: "갱신",
    routeArrow: "→",
    submitting: "입찰 중..."
  }
} as const;

const sourceLabels = {
  en: {
    CARRIER_FAK: "Carrier FAK",
    CARRIER_PUBLIC_TARIFF: "Carrier public tariff",
    INTERNAL_MASTER: "Internal master",
    SCFI: "SCFI"
  },
  ko: {
    CARRIER_FAK: "선사 FAK",
    CARRIER_PUBLIC_TARIFF: "선사 공시 운임",
    INTERNAL_MASTER: "내부 기준 운임",
    SCFI: "SCFI"
  }
} as const;

function money(value: number | null) {
  if (value == null) return "-";
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function dateOnly(value: string) {
  return value.slice(0, 10);
}

function sourceLabel(source: string, language: Language) {
  return sourceLabels[language][source as keyof (typeof sourceLabels)[typeof language]] ?? source;
}

export function CarrierAuctionBoard({ initialData, language }: { initialData: LiveAuctionPayload; language: Language }) {
  const t = text[language];
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [biddingPoolId, setBiddingPoolId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/auctions/live", { cache: "no-store" });
      if (!response.ok) return;
      setData(await response.json());
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refresh();
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  async function submitBid(pool: AuctionPool) {
    setBiddingPoolId(pool.poolId);
    setMessage(null);
    const proposedRateUsd = Math.max(1, (pool.currentLowestRateUsd ?? pool.scfiBaseRateUsd) - 50);

    try {
      const response = await fetch(`/api/auctions/${pool.poolId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposedRateUsd })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? `Request failed with ${response.status}`);
      }

      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "BID_FAILED");
    } finally {
      setBiddingPoolId(null);
    }
  }

  const refreshedAt = useMemo(() => new Date(data.refreshedAt).toLocaleTimeString(), [data.refreshedAt]);

  return (
    <>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gavel className="text-harbor" size={20} />
            <h2 className="text-lg font-semibold">{t.liveAuctions}</h2>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            onClick={() => void refresh()}
            type="button"
          >
            <RefreshCw className={isRefreshing ? "animate-spin" : ""} size={15} />
            {t.refreshed} {refreshedAt}
          </button>
        </div>
        {message ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {data.auctionPools.length === 0 ? <p className="text-sm text-slate-500">{t.emptyAuctions}</p> : null}
          {data.auctionPools.map((pool) => (
            <div className="rounded-md border border-slate-200 p-4" key={pool.poolId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {t.pool} #{pool.poolId}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {pool.polCode} {t.routeArrow} {pool.podCode} / {pool.containerType ?? "LCL"} / ETD {dateOnly(pool.targetEtd)}
                  </p>
                </div>
                <p className="rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">LIVE</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">{t.appliedCeiling}</p>
                  <p className="font-semibold">{money(pool.scfiBaseRateUsd)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t.currentLowest}</p>
                  <p className="font-semibold text-harbor">{money(pool.currentLowestRateUsd)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t.bidCount}</p>
                  <p className="font-semibold">{pool.bidCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t.participants}</p>
                  <p className="font-semibold">{pool.participantCount}</p>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">{t.rateChecks}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {pool.rateBenchmarks.map((benchmark) => (
                    <div className="rounded border border-slate-200 bg-white px-2 py-2" key={`${benchmark.source}-${benchmark.validFrom}`}>
                      <p className="text-xs font-semibold text-slate-700">{sourceLabel(benchmark.source, language)}</p>
                      <p className="mt-1 text-sm font-semibold">{money(benchmark.rateUsd)}</p>
                      <p className="mt-1 text-xs leading-4 text-slate-500">{benchmark.sourceLabel}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {benchmark.collectedAt ? `${t.collected} ${dateOnly(benchmark.collectedAt)}` : benchmark.validFrom}
                      </p>
                    </div>
                  ))}
                  {pool.rateBenchmarks.length === 0 ? <p className="text-sm text-slate-500">{money(pool.scfiBaseRateUsd)}</p> : null}
                </div>
              </div>

              <button
                className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-ink px-3 text-sm font-medium text-white disabled:opacity-50"
                disabled={biddingPoolId != null}
                onClick={() => void submitBid(pool)}
                type="button"
              >
                {biddingPoolId === pool.poolId ? t.submitting : t.bid50Lower}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t.bidLedger}</h2>
        <div className="mt-4 space-y-3">
          {data.myBids.length === 0 ? <p className="text-sm text-slate-500">{t.emptyBids}</p> : null}
          {data.myBids.map((bid) => (
            <div className="rounded-md border border-slate-200 p-4" key={bid.bidId}>
              <p className="font-semibold">
                Bid #{bid.bidId} / {t.pool} #{bid.poolId}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {bid.polCode} {t.routeArrow} {bid.podCode} / {money(bid.proposedRateUsd)} /{" "}
                {bid.isWinningAtTime ? t.currentLowest : t.outbid}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
