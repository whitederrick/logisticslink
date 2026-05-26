"use client";

import { Gavel, PackagePlus, Play, RefreshCw, Send, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

type FlowStatus = "READY" | "QUOTE_CREATED" | "POOL_CREATED" | "AUCTION" | "BID_PLACED" | "AWARDED";

type FlowState = {
  quoteId?: number;
  poolId?: number;
  bidId?: number;
  finalRateUsd?: number;
  status: FlowStatus;
};

type LogEntry = {
  label: string;
  detail: string;
};

type StepKey = "quote" | "pool" | "auction" | "bid" | "award";

const text = {
  eyebrow: "\uc6b4\uc601 \uc6cc\ud06c\ud50c\ub85c\uc6b0",
  title: "\uc6b4\uc601 \ub300\uc2dc\ubcf4\ub4dc",
  subtitle: "\uacac\uc801 \uc0dd\uc131\ubd80\ud130 \ub099\ucc30 \ucc98\ub9ac\uae4c\uc9c0 MVP \uacbd\ub9e4 \ud750\ub984\uc744 \uc21c\uc11c\ub300\ub85c \ud655\uc778\ud569\ub2c8\ub2e4.",
  reset: "\ucd08\uae30\ud654",
  run: "\uc2e4\ud589",
  status: "\ud604\uc7ac \uc0c1\ud0dc",
  logTitle: "\uc2e4\ud589 \uae30\ub85d",
  emptyLog: "\uc67c\ucabd\uc758 \uc2e4\ud589 \ubc84\ud2bc\uc744 \uc21c\uc11c\ub300\ub85c \ub204\ub974\uba74 \uacb0\uacfc\uac00 \uc5ec\uae30\uc5d0 \uc313\uc785\ub2c8\ub2e4.",
  flowTitle: "\uacbd\ub9e4 \ud750\ub984",
  flowHint: "\ub2e4\uc74c\uc5d0 \uc2e4\ud589\ud560 \ub2e8\uacc4\ub9cc \ud65c\uc131\ud654\ub429\ub2c8\ub2e4.",
  metrics: {
    quote: "\uc0dd\uc131\ub41c \uacac\uc801",
    pool: "\uacf5\ub3d9\uad6c\ub9e4 \ud480",
    bid: "\uc785\ucc30 \ubc88\ud638"
  },
  steps: {
    quoteTitle: "\uacac\uc801 \uc0dd\uc131",
    quoteDescription: "\ubd80\uc0b0 \u2192 \ub871\ube44\uce58 FCL \uacac\uc801\uc744 \uc0dd\uc131\ud569\ub2c8\ub2e4.",
    poolTitle: "\ud480 \uc0dd\uc131",
    poolDescription: "\uc0dd\uc131\ub41c \uacac\uc801\uc744 \uae30\uc900\uc73c\ub85c \uacf5\ub3d9\uad6c\ub9e4 \ud480\uc744 \ub9cc\ub4ed\ub2c8\ub2e4.",
    auctionTitle: "\uacbd\ub9e4 \uc2dc\uc791",
    auctionDescription: "\uad00\ub9ac\uc790 \uad8c\ud55c\uc73c\ub85c \ud480\uc744 \uacbd\ub9e4 \uc0c1\ud0dc\ub85c \uc804\ud658\ud569\ub2c8\ub2e4.",
    bidTitle: "\uc120\uc0ac \uc785\ucc30",
    bidDescription: "\ub370\ubaa8 \uc120\uc0ac \uacc4\uc815\uc73c\ub85c \uae30\uc900 \uc6b4\uc784\ubcf4\ub2e4 \ub0ae\uac8c \uc785\ucc30\ud569\ub2c8\ub2e4.",
    awardTitle: "\ub099\ucc30 \ucc98\ub9ac",
    awardDescription: "\ucd5c\uc800 \uc785\ucc30\uc744 \ub099\ucc30 \uc6b4\uc784\uc73c\ub85c \ud655\uc815\ud569\ub2c8\ub2e4."
  },
  logs: {
    quote: "\uacac\uc801 \uc0dd\uc131",
    pool: "\ud480 \uc0dd\uc131",
    auction: "\uacbd\ub9e4 \uc2dc\uc791",
    bid: "\uc120\uc0ac \uc785\ucc30",
    award: "\ub099\ucc30 \ucc98\ub9ac",
    error: "\uc624\ub958",
    unknownError: "\uc54c \uc218 \uc5c6\ub294 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4."
  }
};

const statusLabels: Record<FlowStatus, string> = {
  READY: "\uc900\ube44",
  QUOTE_CREATED: "\uacac\uc801 \uc0dd\uc131",
  POOL_CREATED: "\ud480 \uc0dd\uc131",
  AUCTION: "\uacbd\ub9e4 \uc911",
  BID_PLACED: "\uc785\ucc30 \uc644\ub8cc",
  AWARDED: "\ub099\ucc30 \uc644\ub8cc"
};

const initialFlow: FlowState = { status: "READY" };

const steps: Array<{
  key: StepKey;
  title: string;
  description: string;
  icon: typeof PackagePlus;
}> = [
  {
    key: "quote",
    title: text.steps.quoteTitle,
    description: text.steps.quoteDescription,
    icon: PackagePlus
  },
  {
    key: "pool",
    title: text.steps.poolTitle,
    description: text.steps.poolDescription,
    icon: Send
  },
  {
    key: "auction",
    title: text.steps.auctionTitle,
    description: text.steps.auctionDescription,
    icon: Play
  },
  {
    key: "bid",
    title: text.steps.bidTitle,
    description: text.steps.bidDescription,
    icon: Gavel
  },
  {
    key: "award",
    title: text.steps.awardTitle,
    description: text.steps.awardDescription,
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
      [text.metrics.quote, flow.quoteId == null ? "-" : String(flow.quoteId)],
      [text.metrics.pool, flow.poolId == null ? "-" : String(flow.poolId)],
      [text.metrics.bid, flow.bidId == null ? "-" : String(flow.bidId)],
      [text.status, statusLabels[flow.status]]
    ],
    [flow]
  );

  const canRun: Record<StepKey, boolean> = {
    quote: flow.status === "READY",
    pool: flow.status === "QUOTE_CREATED",
    auction: flow.status === "POOL_CREATED",
    bid: flow.status === "AUCTION",
    award: flow.status === "BID_PLACED"
  };

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
    addLog(text.logs.quote, `quoteId ${result.quoteId}, guideRateUsd $${result.guideRateUsd}`);
  }

  async function createPool() {
    if (flow.quoteId == null) return;

    const result = await postJson<{ poolId: number; status: string }>("/api/pools", {
      quoteId: flow.quoteId,
      scfiBaseRateUsd: 3200
    });

    setFlow((current) => ({ ...current, poolId: result.poolId, status: "POOL_CREATED" }));
    addLog(text.logs.pool, `poolId ${result.poolId}, status ${result.status}`);
  }

  async function startAuction() {
    if (flow.poolId == null) return;

    const result = await postJson<{ status: string }>(`/api/admin/pools/${flow.poolId}/start-auction`);

    setFlow((current) => ({ ...current, status: "AUCTION" }));
    addLog(text.logs.auction, `status ${result.status}`);
  }

  async function placeBid() {
    if (flow.poolId == null) return;

    const result = await postJson<{ bidId: number; proposedRateUsd: number }>(
      `/api/auctions/${flow.poolId}/bids`,
      { proposedRateUsd: 2950 }
    );

    setFlow((current) => ({ ...current, bidId: result.bidId, status: "BID_PLACED" }));
    addLog(text.logs.bid, `bidId ${result.bidId}, proposedRateUsd $${result.proposedRateUsd}`);
  }

  async function closeAuction() {
    if (flow.poolId == null) return;

    const result = await postJson<{ status: string; finalRateUsd: number }>(
      `/api/admin/pools/${flow.poolId}/close-auction`
    );

    setFlow((current) => ({ ...current, finalRateUsd: result.finalRateUsd, status: "AWARDED" }));
    addLog(text.logs.award, `status ${result.status}, finalRateUsd $${result.finalRateUsd}`);
  }

  async function runStep(stepKey: StepKey) {
    setIsRunning(true);
    try {
      if (stepKey === "quote") await createQuote();
      if (stepKey === "pool") await createPool();
      if (stepKey === "auction") await startAuction();
      if (stepKey === "bid") await placeBid();
      if (stepKey === "award") await closeAuction();
    } catch (error) {
      addLog(text.logs.error, error instanceof Error ? error.message : text.logs.unknownError);
    } finally {
      setIsRunning(false);
    }
  }

  function resetFlow() {
    setFlow(initialFlow);
    setLogs([]);
  }

  return (
    <main className="min-h-screen bg-deck px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-harbor">{text.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold">{text.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{text.subtitle}</p>
          </div>
          <button
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-400"
            onClick={resetFlow}
            type="button"
          >
            <RefreshCw size={16} />
            {text.reset}
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 truncate text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{text.flowTitle}</h2>
                <p className="mt-1 text-sm text-slate-500">{text.flowHint}</p>
              </div>
            </div>

            <div className="grid gap-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const enabled = canRun[step.key] && !isRunning;

                return (
                  <button
                    className="grid min-h-20 grid-cols-[2.25rem_minmax(0,1fr)_4rem] items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left transition enabled:hover:border-harbor enabled:hover:bg-teal-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-55"
                    disabled={!enabled}
                    key={step.key}
                    onClick={() => runStep(step.key)}
                    type="button"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-harbor/10 text-harbor">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {index + 1}. {step.title}
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-slate-500">{step.description}</span>
                    </span>
                    <span className="text-right text-sm font-medium text-harbor">{text.run}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{text.logTitle}</h2>
            <div className="mt-5 space-y-3">
              {logs.length === 0 ? (
                <p className="text-sm leading-6 text-slate-500">{text.emptyLog}</p>
              ) : (
                logs.map((log, index) => (
                  <div className="rounded-md border border-slate-200 p-3" key={`${log.label}-${index}`}>
                    <p className="text-sm font-semibold">{log.label}</p>
                    <p className="mt-1 break-words text-sm text-slate-600">{log.detail}</p>
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
