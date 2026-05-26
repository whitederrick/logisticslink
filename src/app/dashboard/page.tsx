"use client";

import { Gavel, PackagePlus, Play, RefreshCw, Send, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

type FlowState = {
  quoteId?: number;
  poolId?: number;
  bidId?: number;
  finalRateUsd?: number;
  status: "READY" | "QUOTE_CREATED" | "POOL_CREATED" | "AUCTION" | "BID_PLACED" | "AWARDED";
};

type LogEntry = {
  label: string;
  detail: string;
};

const initialFlow: FlowState = { status: "READY" };

const steps = [
  {
    key: "quote",
    title: "견적 생성",
    description: "부산 → 롱비치 FCL 견적을 생성합니다.",
    icon: PackagePlus
  },
  {
    key: "pool",
    title: "풀 생성",
    description: "생성된 견적을 기준으로 공동구매 풀을 만듭니다.",
    icon: Send
  },
  {
    key: "auction",
    title: "경매 시작",
    description: "관리자 권한으로 풀을 경매 상태로 전환합니다.",
    icon: Play
  },
  {
    key: "bid",
    title: "선사 입찰",
    description: "데모 선사 계정으로 기준 운임보다 낮게 입찰합니다.",
    icon: Gavel
  },
  {
    key: "award",
    title: "낙찰 처리",
    description: "최저 입찰을 낙찰 운임으로 확정합니다.",
    icon: Trophy
  }
];

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: body == null ? undefined : { "Content-Type": "application/json" },
    body: body == null ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export default function DashboardPage() {
  const [flow, setFlow] = useState<FlowState>(initialFlow);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const metrics = useMemo(
    () => [
      ["생성된 견적", flow.quoteId == null ? "-" : String(flow.quoteId)],
      ["공동구매 풀", flow.poolId == null ? "-" : String(flow.poolId)],
      ["입찰 번호", flow.bidId == null ? "-" : String(flow.bidId)],
      ["현재 상태", flow.status]
    ],
    [flow]
  );

  function addLog(label: string, detail: string) {
    setLogs((current) => [{ label, detail }, ...current].slice(0, 8));
  }

  async function createQuote() {
    const result = await postJson<{ quoteId: number; guideRateUsd: number }>("/api/quotes", {
      requesterId: 2,
      mode: "OCEAN_FCL",
      polCode: "KRPUS",
      podCode: "USLGB",
      targetEtd: "2026-08-01",
      cargoType: "FCL_DRY",
      containerType: "40FT_DRY",
      quantity: 1,
      weightTon: 10,
      isHazardous: false,
      isReefer: false
    });

    setFlow({ quoteId: result.quoteId, status: "QUOTE_CREATED" });
    addLog("견적 생성", `quoteId ${result.quoteId}, 가이드 운임 $${result.guideRateUsd}`);
  }

  async function createPool() {
    if (flow.quoteId == null) return;

    const result = await postJson<{ poolId: number; status: string }>("/api/pools", {
      quoteId: flow.quoteId,
      scfiBaseRateUsd: 3200
    });

    setFlow((current) => ({ ...current, poolId: result.poolId, status: "POOL_CREATED" }));
    addLog("풀 생성", `poolId ${result.poolId}, 상태 ${result.status}`);
  }

  async function startAuction() {
    if (flow.poolId == null) return;

    const result = await postJson<{ status: string }>(`/api/admin/pools/${flow.poolId}/start-auction`);

    setFlow((current) => ({ ...current, status: "AUCTION" }));
    addLog("경매 시작", `상태 ${result.status}`);
  }

  async function placeBid() {
    if (flow.poolId == null) return;

    const result = await postJson<{ bidId: number; proposedRateUsd: number }>(
      `/api/auctions/${flow.poolId}/bids`,
      { proposedRateUsd: 2950 }
    );

    setFlow((current) => ({ ...current, bidId: result.bidId, status: "BID_PLACED" }));
    addLog("선사 입찰", `bidId ${result.bidId}, 제안 운임 $${result.proposedRateUsd}`);
  }

  async function closeAuction() {
    if (flow.poolId == null) return;

    const result = await postJson<{ status: string; finalRateUsd: number }>(
      `/api/admin/pools/${flow.poolId}/close-auction`
    );

    setFlow((current) => ({ ...current, finalRateUsd: result.finalRateUsd, status: "AWARDED" }));
    addLog("낙찰 처리", `상태 ${result.status}, 최종 운임 $${result.finalRateUsd}`);
  }

  async function runStep(stepKey: string) {
    setIsRunning(true);
    try {
      if (stepKey === "quote") await createQuote();
      if (stepKey === "pool") await createPool();
      if (stepKey === "auction") await startAuction();
      if (stepKey === "bid") await placeBid();
      if (stepKey === "award") await closeAuction();
    } catch (error) {
      addLog("오류", error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsRunning(false);
    }
  }

  function resetFlow() {
    setFlow(initialFlow);
    setLogs([]);
  }

  const canRun = {
    quote: flow.status === "READY",
    pool: flow.status === "QUOTE_CREATED",
    auction: flow.status === "POOL_CREATED",
    bid: flow.status === "AUCTION",
    award: flow.status === "BID_PLACED"
  };

  return (
    <main className="min-h-screen bg-deck px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">ForwardLink MVP</p>
            <h1 className="mt-2 text-3xl font-semibold">운영 대시보드</h1>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm"
            onClick={resetFlow}
            type="button"
          >
            <RefreshCw size={16} />
            초기화
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">경매 흐름 실행</h2>
            <div className="mt-5 grid gap-3">
              {steps.map((step) => {
                const Icon = step.icon;
                const enabled = canRun[step.key as keyof typeof canRun] && !isRunning;

                return (
                  <button
                    className="flex items-center justify-between gap-4 rounded border border-slate-200 bg-white p-4 text-left transition enabled:hover:border-harbor enabled:hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={!enabled}
                    key={step.key}
                    onClick={() => runStep(step.key)}
                    type="button"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded bg-harbor/10 text-harbor">
                        <Icon size={19} />
                      </span>
                      <span>
                        <span className="block font-semibold">{step.title}</span>
                        <span className="mt-1 block text-sm text-slate-500">{step.description}</span>
                      </span>
                    </span>
                    <span className="text-sm font-medium text-harbor">실행</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">실행 기록</h2>
            <div className="mt-5 space-y-3">
              {logs.length === 0 ? (
                <p className="text-sm leading-6 text-slate-500">왼쪽 버튼을 순서대로 실행하면 결과가 여기에 표시됩니다.</p>
              ) : (
                logs.map((log, index) => (
                  <div className="rounded border border-slate-200 p-3" key={`${log.label}-${index}`}>
                    <p className="text-sm font-semibold">{log.label}</p>
                    <p className="mt-1 text-sm text-slate-600">{log.detail}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
