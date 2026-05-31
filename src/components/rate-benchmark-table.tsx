"use client";

import { Language } from "@/lib/i18n";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type RateBenchmarkRow = {
  benchmarkType: string;
  confidenceScore: number;
  containerGroup: string;
  currency: string;
  externalRef: string | null;
  id: number;
  podCode: string;
  polCode: string;
  provider: string | null;
  rateUsd: number;
  source: string;
  sourceLabel: string;
  sourceTier: string;
  validFrom: string;
};

type EditableRateBenchmark = {
  benchmarkType: string;
  confidenceScore: string;
  containerGroup: string;
  externalRef: string;
  podCode: string;
  polCode: string;
  provider: string;
  rateUsd: string;
  source: string;
  sourceLabel: string;
  sourceTier: string;
  validFrom: string;
};

const text = {
  en: {
    actions: "Actions",
    confidence: "Confidence",
    cancel: "Cancel edit",
    confirmDelete: "Delete this rate benchmark?",
    delete: "Delete",
    deleted: "Rate benchmark deleted.",
    deleting: "Deleting...",
    edit: "Edit",
    group: "Group",
    rate: "Rate",
    route: "Route",
    save: "Save changes",
    saved: "Rate benchmark updated.",
    saving: "Saving...",
    source: "Source",
    type: "Type",
    validFrom: "Valid from"
  },
  ko: {
    actions: "관리",
    confidence: "신뢰도",
    cancel: "수정 취소",
    confirmDelete: "이 운임 기준을 삭제할까요?",
    delete: "삭제",
    deleted: "운임 기준을 삭제했습니다.",
    deleting: "삭제 중...",
    edit: "수정",
    group: "그룹",
    rate: "운임",
    route: "항로",
    save: "변경 저장",
    saved: "운임 기준을 수정했습니다.",
    saving: "저장 중...",
    source: "출처",
    type: "유형",
    validFrom: "적용일"
  }
} as const;

const sourceOptions = [
  { ko: "SCFI", en: "SCFI", value: "SCFI" },
  { ko: "Freightos FBX", en: "Freightos FBX", value: "FBX" },
  { ko: "Drewry WCI", en: "Drewry WCI", value: "DREWRY_WCI" },
  { ko: "선사 FAK", en: "Carrier FAK", value: "CARRIER_FAK" },
  { ko: "선사 공시 운임", en: "Carrier public tariff", value: "CARRIER_PUBLIC_TARIFF" },
  { ko: "Xeneta Spot", en: "Xeneta Spot", value: "XENETA_SPOT" },
  { ko: "Xeneta Contract", en: "Xeneta Contract", value: "XENETA_CONTRACT" },
  { ko: "유료 API", en: "Commercial API", value: "COMMERCIAL_API" },
  { ko: "내부 기준 운임", en: "Internal master", value: "INTERNAL_MASTER" }
];

const groupOptions = ["DRY", "REEFER", "LCL"] as const;
const tierOptions = ["PUBLIC", "PARTNER", "PAID", "INTERNAL", "LEGACY"] as const;
const typeOptions = ["MARKET_INDEX", "SPOT_RATE", "CONTRACT_RATE", "FAK", "PUBLIC_TARIFF", "INTERNAL_MASTER"] as const;

function sourceLabel(source: string, language: Language) {
  return sourceOptions.find((option) => option.value === source)?.[language] ?? source;
}

function money(value: string | number) {
  return `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function toEditable(rate: RateBenchmarkRow): EditableRateBenchmark {
  return {
    benchmarkType: rate.benchmarkType,
    confidenceScore: String(rate.confidenceScore),
    containerGroup: rate.containerGroup,
    externalRef: rate.externalRef ?? "",
    podCode: rate.podCode,
    polCode: rate.polCode,
    provider: rate.provider ?? "",
    rateUsd: String(rate.rateUsd),
    source: rate.source,
    sourceLabel: rate.sourceLabel,
    sourceTier: rate.sourceTier,
    validFrom: rate.validFrom
  };
}

export function RateBenchmarkTable({ language, rates }: { language: Language; rates: RateBenchmarkRow[] }) {
  const router = useRouter();
  const t = text[language];
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditableRateBenchmark | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function startEdit(rate: RateBenchmarkRow) {
    setEditingId(rate.id);
    setDraft(toEditable(rate));
    setMessage(null);
  }

  function updateDraft(field: keyof EditableRateBenchmark, value: string) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  async function save(rateId: number) {
    if (!draft) return;
    setPendingId(rateId);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/rate-benchmarks/${rateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          confidenceScore: Number(draft.confidenceScore),
          currency: "USD",
          podCode: draft.podCode.toUpperCase(),
          polCode: draft.polCode.toUpperCase(),
          rateUsd: Number(draft.rateUsd)
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with ${response.status}`);
      }

      setEditingId(null);
      setDraft(null);
      setMessage(t.saved);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "UPDATE_FAILED");
    } finally {
      setPendingId(null);
    }
  }

  async function remove(rateId: number) {
    if (!window.confirm(t.confirmDelete)) return;
    setPendingId(rateId);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/rate-benchmarks/${rateId}`, { method: "DELETE" });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with ${response.status}`);
      }

      setMessage(t.deleted);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "DELETE_FAILED");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
          <tr>
            <th className="py-2 pr-4 font-semibold">{t.source}</th>
            <th className="py-2 pr-4 font-semibold">{t.type}</th>
            <th className="py-2 pr-4 font-semibold">{t.route}</th>
            <th className="py-2 pr-4 font-semibold">{t.group}</th>
            <th className="py-2 pr-4 font-semibold">{t.rate}</th>
            <th className="py-2 pr-4 font-semibold">{t.confidence}</th>
            <th className="py-2 pr-4 font-semibold">{t.validFrom}</th>
            <th className="py-2 pr-4 font-semibold">{t.actions}</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => {
            const isEditing = editingId === rate.id && draft;
            const isPending = pendingId === rate.id;

            return (
              <tr className="border-b border-slate-100 align-top" key={rate.id}>
                <td className="py-3 pr-4">
                  {isEditing ? (
                    <div className="grid min-w-48 gap-2">
                      <select
                        className="h-10 rounded-md border border-slate-300 bg-white px-3"
                        onChange={(event) => updateDraft("source", event.target.value)}
                        value={draft.source}
                      >
                        {sourceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option[language]}
                          </option>
                        ))}
                      </select>
                      <select
                        className="h-10 rounded-md border border-slate-300 bg-white px-3"
                        onChange={(event) => updateDraft("sourceTier", event.target.value)}
                        value={draft.sourceTier}
                      >
                        {tierOptions.map((tier) => (
                          <option key={tier} value={tier}>
                            {tier}
                          </option>
                        ))}
                      </select>
                      <input
                        className="h-10 rounded-md border border-slate-300 px-3"
                        onChange={(event) => updateDraft("sourceLabel", event.target.value)}
                        required
                        value={draft.sourceLabel}
                      />
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold">{sourceLabel(rate.source, language)}</p>
                      <p className="mt-1 text-xs text-slate-500">{rate.sourceTier}</p>
                      <p className="mt-1 text-xs text-slate-500">{rate.sourceLabel}</p>
                      {rate.provider ? <p className="mt-1 text-xs text-slate-500">{rate.provider}</p> : null}
                    </>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {isEditing ? (
                    <select
                      className="h-10 rounded-md border border-slate-300 bg-white px-3"
                      onChange={(event) => updateDraft("benchmarkType", event.target.value)}
                      value={draft.benchmarkType}
                    >
                      {typeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="whitespace-nowrap">{rate.benchmarkType.replaceAll("_", " ")}</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {isEditing ? (
                    <div className="grid min-w-40 gap-2 sm:grid-cols-2">
                      <input
                        className="h-10 rounded-md border border-slate-300 px-3 uppercase"
                        onChange={(event) => updateDraft("polCode", event.target.value)}
                        required
                        value={draft.polCode}
                      />
                      <input
                        className="h-10 rounded-md border border-slate-300 px-3 uppercase"
                        onChange={(event) => updateDraft("podCode", event.target.value)}
                        required
                        value={draft.podCode}
                      />
                    </div>
                  ) : (
                    <>
                      {rate.polCode} {language === "ko" ? "→" : "to"} {rate.podCode}
                    </>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {isEditing ? (
                    <select
                      className="h-10 rounded-md border border-slate-300 bg-white px-3"
                      onChange={(event) => updateDraft("containerGroup", event.target.value)}
                      value={draft.containerGroup}
                    >
                      {groupOptions.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                  ) : (
                    rate.containerGroup
                  )}
                </td>
                <td className="py-3 pr-4 font-semibold">
                  {isEditing ? (
                    <input
                      className="h-10 w-28 rounded-md border border-slate-300 px-3"
                      min="1"
                      onChange={(event) => updateDraft("rateUsd", event.target.value)}
                      required
                      step="0.01"
                      type="number"
                      value={draft.rateUsd}
                    />
                  ) : (
                    money(rate.rateUsd)
                  )}
                </td>
                <td className="py-3 pr-4">
                  {isEditing ? (
                    <input
                      className="h-10 w-24 rounded-md border border-slate-300 px-3"
                      max="100"
                      min="1"
                      onChange={(event) => updateDraft("confidenceScore", event.target.value)}
                      required
                      type="number"
                      value={draft.confidenceScore}
                    />
                  ) : (
                    `${rate.confidenceScore}/100`
                  )}
                </td>
                <td className="py-3 pr-4">
                  {isEditing ? (
                    <input
                      className="h-10 rounded-md border border-slate-300 px-3"
                      onChange={(event) => updateDraft("validFrom", event.target.value)}
                      required
                      type="date"
                      value={draft.validFrom}
                    />
                  ) : (
                    rate.validFrom
                  )}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button
                          aria-label={t.save}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-ink text-white disabled:opacity-50"
                          disabled={isPending}
                          onClick={() => save(rate.id)}
                          title={t.save}
                          type="button"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          aria-label={t.cancel}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700"
                          onClick={() => {
                            setEditingId(null);
                            setDraft(null);
                          }}
                          title={t.cancel}
                          type="button"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          aria-label={t.edit}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700"
                          disabled={isPending}
                          onClick={() => startEdit(rate)}
                          title={t.edit}
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label={t.delete}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-700 disabled:opacity-50"
                          disabled={isPending}
                          onClick={() => remove(rate.id)}
                          title={isPending ? t.deleting : t.delete}
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {message ? <p className="mt-3 text-sm text-slate-500">{message}</p> : null}
    </div>
  );
}
