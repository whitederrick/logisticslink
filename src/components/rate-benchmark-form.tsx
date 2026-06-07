"use client";

import { Language } from "@/lib/i18n";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const text = {
  en: {
    benchmarkType: "Benchmark type",
    confidenceScore: "Confidence",
    containerGroup: "Container group",
    externalRef: "External ref",
    podCode: "Destination",
    polCode: "Origin",
    provider: "Provider",
    rateUsd: "Rate USD",
    save: "Save rate",
    saved: "Rate benchmark saved.",
    saving: "Saving...",
    source: "Source",
    sourceLabel: "Source label",
    sourceTier: "Tier",
    validFrom: "Valid from"
  },
  ko: {
    benchmarkType: "기준 유형",
    confidenceScore: "신뢰도",
    containerGroup: "컨테이너 그룹",
    externalRef: "외부 참조",
    podCode: "도착항",
    polCode: "출발항",
    provider: "제공자",
    rateUsd: "운임 USD",
    save: "운임 기준 저장",
    saved: "운임 기준을 저장했습니다.",
    saving: "저장 중...",
    source: "출처",
    sourceLabel: "출처 설명",
    sourceTier: "등급",
    validFrom: "적용일"
  }
} as const;

const sourceOptions = [
  { label: "SCFI", value: "SCFI" },
  { label: "Freightos FBX", value: "FBX" },
  { label: "Drewry WCI", value: "DREWRY_WCI" },
  { label: "선사 FAK", value: "CARRIER_FAK" },
  { label: "선사 공시 운임", value: "CARRIER_PUBLIC_TARIFF" },
  { label: "Xeneta Spot", value: "XENETA_SPOT" },
  { label: "Xeneta Contract", value: "XENETA_CONTRACT" },
  { label: "유료 API", value: "COMMERCIAL_API" },
  { label: "내부 기준 운임", value: "INTERNAL_MASTER" }
];

const groupOptions = ["DRY", "REEFER", "LCL"] as const;
const tierOptions = ["PUBLIC", "PARTNER", "PAID", "INTERNAL", "LEGACY"] as const;
const typeOptions = ["MARKET_INDEX", "SPOT_RATE", "CONTRACT_RATE", "FAK", "PUBLIC_TARIFF", "INTERNAL_MASTER"] as const;

export function RateBenchmarkForm({ language }: { language: Language }) {
  const router = useRouter();
  const t = text[language];
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setIsPending(true);
    setMessage(null);

    const payload = {
      benchmarkType: String(formData.get("benchmarkType")),
      containerGroup: String(formData.get("containerGroup")),
      confidenceScore: Number(formData.get("confidenceScore")),
      currency: "USD",
      externalRef: String(formData.get("externalRef") ?? ""),
      podCode: String(formData.get("podCode")).toUpperCase(),
      polCode: String(formData.get("polCode")).toUpperCase(),
      provider: String(formData.get("provider") ?? ""),
      rateUsd: Number(formData.get("rateUsd")),
      source: String(formData.get("source")),
      sourceLabel: String(formData.get("sourceLabel")),
      sourceTier: String(formData.get("sourceTier")),
      validFrom: String(formData.get("validFrom"))
    };

    try {
      const response = await fetch("/api/admin/rate-benchmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with ${response.status}`);
      }

      setMessage(t.saved);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "SAVE_FAILED");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form action={submit} className="mt-4 grid gap-3 lg:grid-cols-6">
      <label className="grid gap-1 text-sm">
        {t.source}
        <select className="h-10 rounded-md border border-slate-300 bg-white px-3" defaultValue="SCFI" name="source">
          {sourceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {language === "ko" ? option.label : option.value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        {t.sourceTier}
        <select className="h-10 rounded-md border border-slate-300 bg-white px-3" defaultValue="PUBLIC" name="sourceTier">
          {tierOptions.map((tier) => (
            <option key={tier} value={tier}>
              {tier}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        {t.benchmarkType}
        <select className="h-10 rounded-md border border-slate-300 bg-white px-3" defaultValue="MARKET_INDEX" name="benchmarkType">
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        {t.polCode}
        <input className="h-10 rounded-md border border-slate-300 px-3 uppercase" defaultValue="KRPUS" name="polCode" required />
      </label>
      <label className="grid gap-1 text-sm">
        {t.podCode}
        <input className="h-10 rounded-md border border-slate-300 px-3 uppercase" defaultValue="USLGB" name="podCode" required />
      </label>
      <label className="grid gap-1 text-sm">
        {t.containerGroup}
        <select className="h-10 rounded-md border border-slate-300 bg-white px-3" defaultValue="DRY" name="containerGroup">
          {groupOptions.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        {t.rateUsd}
        <input className="h-10 rounded-md border border-slate-300 px-3" defaultValue="3180" min="1" name="rateUsd" required step="0.01" type="number" />
      </label>
      <label className="grid gap-1 text-sm">
        {t.validFrom}
        <input className="h-10 rounded-md border border-slate-300 px-3" defaultValue="2026-05-27" name="validFrom" required type="date" />
      </label>
      <label className="grid gap-1 text-sm">
        {t.confidenceScore}
        <input className="h-10 rounded-md border border-slate-300 px-3" defaultValue="70" max="100" min="1" name="confidenceScore" required type="number" />
      </label>
      <label className="grid gap-1 text-sm lg:col-span-2">
        {t.provider}
        <input className="h-10 rounded-md border border-slate-300 px-3" defaultValue="ForwardLink Ocean" name="provider" />
      </label>
      <label className="grid gap-1 text-sm lg:col-span-2">
        {t.externalRef}
        <input className="h-10 rounded-md border border-slate-300 px-3" name="externalRef" placeholder="API id, file name, or URL" />
      </label>
      <label className="grid gap-1 text-sm lg:col-span-5">
        {t.sourceLabel}
        <input className="h-10 rounded-md border border-slate-300 px-3" defaultValue="Collected rate benchmark" name="sourceLabel" required />
      </label>
      <div className="flex flex-col justify-end gap-1">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white disabled:opacity-50"
          disabled={isPending}
          type="submit"
        >
          <Save size={16} />
          {isPending ? t.saving : t.save}
        </button>
      </div>
      {message ? <p className="text-sm text-slate-500 lg:col-span-6">{message}</p> : null}
    </form>
  );
}
