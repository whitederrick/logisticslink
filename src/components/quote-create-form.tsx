"use client";

import { calculateCbm } from "@/lib/freight";
import { dateOnly, money } from "@/lib/format";
import { Language } from "@/lib/i18n";
import { containerTypes } from "@/lib/master-data";
import { CheckCircle2, PlusCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type QuoteCreateFormProps = {
  language?: Language;
  requesterId: number;
};

type RecommendedPool = {
  currentTotalVolumeTeu: number;
  daysUntilClose: number;
  expectedDiscountRate: number;
  matchScore: number;
  podCode: string;
  polCode: string;
  poolId: number;
  targetEtd: string;
};

const text = {
  en: {
    cargoType: "Cargo type",
    confirmed: "Terms confirmed",
    container: "Container",
    create: "Create quote",
    createNewPool: "Create new pool from this quote",
    creating: "Creating...",
    createFailed: "Quote creation failed",
    created: (id: number, guideRateUsd: number) => `Quote #${id} created. Guide rate ${money(guideRateUsd)}.`,
    description: "Register demand first, then join a matching blind pool or create a new one.",
    dimensions: {
      height: "Height cm",
      length: "Length cm",
      quantity: "Packages",
      width: "Width cm"
    },
    discount: "Expected discount",
    emptyRecommendations: "No compatible pool was found within plus or minus 3 days.",
    hazardous: "Hazardous",
    join: "Join recommended pool",
    joined: "Joined recommended pool",
    joining: "Joining...",
    matchScore: "Match",
    mode: "Mode",
    newPoolCreated: "New co-buy pool created.",
    packageType: "Package type",
    quantity: "Quantity",
    recommendations: "Recommended co-buy pools",
    recommendationsDescription: "Pools with the same route, cargo type, container, and ETD within plus or minus 3 days are shown first.",
    reefer: "Reefer",
    remaining: "days until auction opens",
    scrollRequired: "Scroll through the terms to continue",
    scrollWarning: "Scroll to the end of the blind pool terms before submitting.",
    terms:
      "LogisticsLink Ocean blind pool terms. Participant company names, quote details, and individual volumes are not disclosed to other shippers, forwarders, or carriers. Auction participation follows the D-14 to D-7 time-lock and carrier bids must remain below the applicable freight benchmark unless a LogisticsLink administrator enables a market override. Scroll to the end to confirm these terms. End.",
    title: "Create quote",
    totalCbm: "Total CBM",
    volume: "Current volume",
    weight: "Weight ton"
  },
  ko: {
    cargoType: "화물 유형",
    confirmed: "약관 확인 완료",
    container: "컨테이너",
    create: "견적 생성",
    createNewPool: "이 견적으로 새 공동구매 풀 생성",
    creating: "생성 중...",
    createFailed: "견적 생성 실패",
    created: (id: number, guideRateUsd: number) => `견적 #${id} 생성 완료. 가이드 운임 ${money(guideRateUsd)}.`,
    description: "먼저 운송 수요를 등록한 뒤, 조건이 맞는 블라인드 풀에 참여하거나 새 풀을 만듭니다.",
    dimensions: {
      height: "높이 cm",
      length: "세로 cm",
      quantity: "포장 수량",
      width: "가로 cm"
    },
    discount: "예상 할인",
    emptyRecommendations: "ETD 전후 3일 안에 바로 참여할 수 있는 풀이 없습니다.",
    hazardous: "위험물",
    join: "추천 풀 참여",
    joined: "추천 풀 참여 완료",
    joining: "참여 중...",
    matchScore: "매칭",
    mode: "운송 방식",
    newPoolCreated: "새 공동구매 풀을 생성했습니다.",
    packageType: "포장 형태",
    quantity: "수량",
    recommendations: "추천 공동구매 풀",
    recommendationsDescription: "항로, 화물 유형, 컨테이너, ETD 전후 3일 조건이 맞는 풀을 먼저 보여줍니다.",
    reefer: "냉동/냉장",
    remaining: "일 후 경매 오픈",
    scrollRequired: "약관을 끝까지 확인해야 합니다",
    scrollWarning: "블라인드 공동구매 약관을 끝까지 스크롤한 뒤 제출해 주세요.",
    terms:
      "LogisticsLink Ocean 블라인드 공동구매 약관입니다. 참여 회사명, 견적 상세, 개별 물량은 다른 화주, 포워더, 선사에게 공개되지 않습니다. 역경매는 D-14부터 D-7까지의 타임락을 따르며, 선사 입찰가는 LogisticsLink 관리자 예외 승인 없이는 적용 운임 기준보다 낮아야 합니다. 약관 확인을 위해 끝까지 스크롤해 주세요. 끝.",
    title: "견적 생성",
    totalCbm: "총 CBM",
    volume: "현재 물량",
    weight: "중량 ton"
  }
} as const;

export function QuoteCreateForm({ language = "ko", requesterId }: QuoteCreateFormProps) {
  const t = text[language];
  const router = useRouter();
  const [mode, setMode] = useState("OCEAN_FCL");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<number | null>(null);
  const [createdGuideRateUsd, setCreatedGuideRateUsd] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedPool[]>([]);
  const [joiningPoolId, setJoiningPoolId] = useState<number | null>(null);
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const [dimensions, setDimensions] = useState({ height: 100, length: 120, quantity: 1, width: 100 });

  const cbm = useMemo(
    () => calculateCbm(dimensions.width, dimensions.length, dimensions.height, dimensions.quantity),
    [dimensions]
  );

  async function loadRecommendations(quoteId: number) {
    const response = await fetch(`/api/quotes/${quoteId}/recommended-pools`, { cache: "no-store" });
    if (!response.ok) {
      setRecommendations([]);
      return;
    }

    const result = await response.json();
    setRecommendations(result.recommendedPools ?? []);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!termsAccepted) {
      setMessage(t.scrollWarning);
      return;
    }

    const form = new FormData(event.currentTarget);
    setIsPending(true);
    setMessage(null);
    setCreatedQuoteId(null);
    setCreatedGuideRateUsd(null);
    setRecommendations([]);

    const payload = {
      requesterId,
      cargoType: form.get("cargoType"),
      containerType: mode === "OCEAN_FCL" ? form.get("containerType") : null,
      isHazardous: form.get("isHazardous") === "on",
      isReefer: form.get("isReefer") === "on",
      mode: form.get("mode"),
      packageType: mode === "OCEAN_LCL" ? form.get("packageType") : undefined,
      podCode: form.get("podCode"),
      polCode: form.get("polCode"),
      quantity: Number(form.get("quantity")),
      targetEtd: form.get("targetEtd"),
      unitSystem: "METRIC",
      volumeCbm: mode === "OCEAN_LCL" ? cbm : undefined,
      weightTon: Number(form.get("weightTon"))
    };

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with ${response.status}`);
      }

      const result = await response.json();
      setCreatedQuoteId(result.quoteId);
      setCreatedGuideRateUsd(result.guideRateUsd);
      setMessage(t.created(result.quoteId, result.guideRateUsd));
      await loadRecommendations(result.quoteId);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.createFailed);
    } finally {
      setIsPending(false);
    }
  }

  async function joinRecommendedPool(poolId: number) {
    if (createdQuoteId == null) return;

    setJoiningPoolId(poolId);
    setMessage(null);

    try {
      const response = await fetch(`/api/pools/${poolId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: createdQuoteId })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with ${response.status}`);
      }

      setMessage(t.joined);
      setRecommendations([]);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.createFailed);
    } finally {
      setJoiningPoolId(null);
    }
  }

  async function createPoolFromQuote() {
    if (createdQuoteId == null) return;

    setIsCreatingPool(true);
    setMessage(null);

    try {
      const response = await fetch("/api/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: createdQuoteId, scfiBaseRateUsd: createdGuideRateUsd ?? 3200 })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with ${response.status}`);
      }

      setMessage(t.newPoolCreated);
      setRecommendations([]);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.createFailed);
    } finally {
      setIsCreatingPool(false);
    }
  }

  function updateDimension(key: keyof typeof dimensions, value: string) {
    setDimensions((current) => ({ ...current, [key]: Number(value) }));
  }

  return (
    <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={submit}>
      <div>
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.description}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          {t.mode}
          <select
            className="rounded-md border border-slate-300 px-3 py-2"
            name="mode"
            onChange={(event) => setMode(event.target.value)}
            value={mode}
          >
            <option value="OCEAN_FCL">{language === "ko" ? "해상 FCL" : "Ocean FCL"}</option>
            <option value="OCEAN_LCL">{language === "ko" ? "해상 LCL" : "Ocean LCL"}</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          ETD
          <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue="2026-06-15" name="targetEtd" type="date" />
        </label>
        <label className="grid gap-1 text-sm">
          POL
          <select className="rounded-md border border-slate-300 px-3 py-2" defaultValue="KRPUS" name="polCode">
            <option value="KRPUS">Busan</option>
            <option value="KRINC">Incheon</option>
            <option value="VNSGN">Ho Chi Minh City</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          POD
          <select className="rounded-md border border-slate-300 px-3 py-2" defaultValue="USLGB" name="podCode">
            <option value="USLGB">Long Beach</option>
            <option value="USLAX">Los Angeles</option>
            <option value="CNSHA">Shanghai</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {t.cargoType}
          <select className="rounded-md border border-slate-300 px-3 py-2" defaultValue="FCL_DRY" name="cargoType">
            <option value="FCL_DRY">FCL Dry</option>
            <option value="FCL_REEFER">FCL Reefer</option>
            <option value="LCL">LCL</option>
          </select>
        </label>
        {mode === "OCEAN_FCL" ? (
          <label className="grid gap-1 text-sm">
            {t.container}
            <select className="rounded-md border border-slate-300 px-3 py-2" defaultValue="40FT_DRY" name="containerType">
              {containerTypes.map((containerType) => (
                <option key={containerType} value={containerType}>
                  {containerType.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="grid gap-1 text-sm">
            {t.packageType}
            <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue="Carton" name="packageType" />
          </label>
        )}
        <label className="grid gap-1 text-sm">
          {t.quantity}
          <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue="1" min="1" name="quantity" type="number" />
        </label>
        <label className="grid gap-1 text-sm">
          {t.weight}
          <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue="10" min="0.1" name="weightTon" step="0.1" type="number" />
        </label>
      </div>

      {mode === "OCEAN_LCL" ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            {(["width", "length", "height", "quantity"] as const).map((key) => (
              <label className="grid gap-1 text-sm" key={key}>
                {t.dimensions[key]}
                <input
                  className="rounded-md border border-slate-300 px-3 py-2"
                  min="1"
                  onChange={(event) => updateDimension(key, event.target.value)}
                  type="number"
                  value={dimensions[key]}
                />
              </label>
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold text-harbor">
            {t.totalCbm} {cbm.toFixed(4)}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input name="isHazardous" type="checkbox" />
          {t.hazardous}
        </label>
        <label className="flex items-center gap-2">
          <input name="isReefer" type="checkbox" />
          {t.reefer}
        </label>
      </div>

      <div
        className="h-24 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600"
        onScroll={(event) => {
          const element = event.currentTarget;
          if (element.scrollTop + element.clientHeight >= element.scrollHeight - 4) {
            setTermsAccepted(true);
          }
        }}
      >
        {t.terms}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={isPending || !termsAccepted}
          type="submit"
        >
          {isPending ? t.creating : t.create}
        </button>
        <p className="text-sm text-slate-500">{message ?? (termsAccepted ? t.confirmed : t.scrollRequired)}</p>
      </div>

      {createdQuoteId != null ? (
        <section className="rounded-md border border-teal-100 bg-teal-50 p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 text-harbor" size={18} />
            <div>
              <h3 className="font-semibold text-ink">{t.recommendations}</h3>
              <p className="mt-1 text-sm text-slate-600">{t.recommendationsDescription}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-3">
            {recommendations.length === 0 ? (
              <div className="rounded-md border border-teal-200 bg-white p-3">
                <p className="text-sm text-slate-600">{t.emptyRecommendations}</p>
                <button
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-ink px-3 text-sm font-medium text-white disabled:opacity-50"
                  disabled={isCreatingPool}
                  onClick={() => void createPoolFromQuote()}
                  type="button"
                >
                  <PlusCircle size={16} />
                  {isCreatingPool ? t.creating : t.createNewPool}
                </button>
              </div>
            ) : null}
            {recommendations.map((pool) => (
              <article className="rounded-md border border-teal-200 bg-white p-3" key={pool.poolId}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      Pool #{pool.poolId} / {pool.polCode} → {pool.podCode}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      ETD {dateOnly(new Date(pool.targetEtd))} / {pool.daysUntilClose} {t.remaining}
                    </p>
                  </div>
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-harbor px-3 text-sm font-medium text-white disabled:opacity-50"
                    disabled={joiningPoolId != null}
                    onClick={() => void joinRecommendedPool(pool.poolId)}
                    type="button"
                  >
                    <CheckCircle2 size={16} />
                    {joiningPoolId === pool.poolId ? t.joining : t.join}
                  </button>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <p className="rounded bg-slate-50 px-2 py-1">
                    {t.matchScore} {pool.matchScore}%
                  </p>
                  <p className="rounded bg-slate-50 px-2 py-1">
                    {t.discount} {pool.expectedDiscountRate}%
                  </p>
                  <p className="rounded bg-slate-50 px-2 py-1">
                    {t.volume} {pool.currentTotalVolumeTeu} TEU
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </form>
  );
}
