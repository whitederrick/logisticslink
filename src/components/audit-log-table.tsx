"use client";

import { Language } from "@/lib/i18n";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useState } from "react";

export type AuditLogRow = {
  action: string;
  actorName: string;
  afterJson: Record<string, unknown> | null;
  beforeJson: Record<string, unknown> | null;
  createdAt: string;
  entityId: number | null;
  entityType: string;
  id: number;
};

const text = {
  en: {
    action: "Action",
    actor: "Actor",
    allActions: "All actions",
    allActors: "All actors",
    allEntities: "All entities",
    after: "After",
    before: "Before",
    changed: "Changed",
    summary: "Summary",
    details: "Details",
    entity: "Entity",
    filter: "Filter",
    noMatchingLogs: "No logs match the selected filters.",
    noDetails: "No detailed payload.",
    time: "Time"
  },
  ko: {
    action: "작업",
    actor: "수행자",
    allActions: "전체 작업",
    allActors: "전체 수행자",
    allEntities: "전체 대상",
    after: "변경 후",
    before: "변경 전",
    changed: "변경됨",
    summary: "요약",
    details: "상세",
    entity: "대상",
    filter: "필터",
    noMatchingLogs: "선택한 필터에 맞는 로그가 없습니다.",
    noDetails: "상세 데이터 없음",
    time: "시간"
  }
} as const;

function prettyJson(value: unknown) {
  if (value == null) return "";
  return JSON.stringify(value, null, 2);
}

function changedFields(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  if (!before || !after) return [];
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

  return keys.filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
}

function valueText(value: unknown) {
  if (value == null) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function detailRows(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  const keys = Array.from(new Set([...(before ? Object.keys(before) : []), ...(after ? Object.keys(after) : [])])).sort();

  return keys.map((key) => ({
    after: after?.[key],
    before: before?.[key],
    changed: JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]),
    key
  }));
}

function summaryText(log: AuditLogRow, language: Language) {
  const reason = log.afterJson?.reason;
  const fields = changedFields(log.beforeJson, log.afterJson);

  if (typeof reason === "string" && reason.trim()) {
    return language === "ko" ? `사유: ${reason}` : `Reason: ${reason}`;
  }

  if (fields.length > 0) {
    return fields
      .slice(0, 3)
      .map((field) => `${field}: ${valueText(log.beforeJson?.[field])} -> ${valueText(log.afterJson?.[field])}`)
      .join(", ");
  }

  if (log.afterJson && "imported" in log.afterJson) {
    const errors = Array.isArray(log.afterJson.errors) ? log.afterJson.errors : [];
    if (errors.length > 0) {
      const labels = errors
        .slice(0, 3)
        .map((error) => (error && typeof error === "object" && "label" in error ? valueText(error.label) : "unknown"))
        .join(", ");
      return `errors: ${errors.length} (${labels}), imported: ${valueText(log.afterJson.imported)}`;
    }

    return `imported: ${valueText(log.afterJson.imported)}`;
  }

  if (log.afterJson && "switchedToAuctionCount" in log.afterJson) {
    return `auction: ${valueText(log.afterJson.switchedToAuctionCount)}, awarded: ${valueText(log.afterJson.awardedCount)}, failed: ${valueText(log.afterJson.failedCount)}`;
  }

  return language === "ko" ? "상세 확인" : "See details";
}

export function AuditLogTable({ language, logs }: { language: Language; logs: AuditLogRow[] }) {
  const t = text[language];
  const [openId, setOpenId] = useState<number | null>(null);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [actorFilter, setActorFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const actions = Array.from(new Set(logs.map((log) => log.action))).sort();
  const actors = Array.from(new Set(logs.map((log) => log.actorName))).sort();
  const entities = Array.from(new Set(logs.map((log) => log.entityType))).sort();
  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
    if (actorFilter !== "ALL" && log.actorName !== actorFilter) return false;
    if (entityFilter !== "ALL" && log.entityType !== entityFilter) return false;
    return true;
  });

  return (
    <div className="mt-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <label className="grid gap-1 text-sm text-slate-600">
          {t.action}
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3" onChange={(event) => setActionFilter(event.target.value)} value={actionFilter}>
            <option value="ALL">{t.allActions}</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm text-slate-600">
          {t.entity}
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3" onChange={(event) => setEntityFilter(event.target.value)} value={entityFilter}>
            <option value="ALL">{t.allEntities}</option>
            {entities.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm text-slate-600">
          {t.actor}
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3" onChange={(event) => setActorFilter(event.target.value)} value={actorFilter}>
            <option value="ALL">{t.allActors}</option>
            {actors.map((actor) => (
              <option key={actor} value={actor}>
                {actor}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredLogs.length === 0 ? <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-500">{t.noMatchingLogs}</p> : null}

      {filteredLogs.length > 0 ? (
        <table className="mt-4 min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-4 font-semibold">{t.details}</th>
              <th className="py-2 pr-4 font-semibold">{t.time}</th>
              <th className="py-2 pr-4 font-semibold">{t.action}</th>
              <th className="py-2 pr-4 font-semibold">{t.summary}</th>
              <th className="py-2 pr-4 font-semibold">{t.entity}</th>
              <th className="py-2 pr-4 font-semibold">{t.actor}</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => {
              const isOpen = openId === log.id;
              const before = prettyJson(log.beforeJson);
              const after = prettyJson(log.afterJson);
              const hasDetails = before || after;
              const details = detailRows(log.beforeJson, log.afterJson);

              return (
                <Fragment key={log.id}>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <button
                        aria-label={t.details}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-700 disabled:opacity-40"
                        disabled={!hasDetails}
                        onClick={() => setOpenId(isOpen ? null : log.id)}
                        type="button"
                      >
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-slate-600">{log.createdAt}</td>
                    <td className="py-3 pr-4 font-semibold">{log.action.replaceAll("_", " ")}</td>
                    <td className="max-w-md py-3 pr-4 text-slate-600">{summaryText(log, language)}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {log.entityType}
                      {log.entityId ? ` #${log.entityId}` : ""}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{log.actorName}</td>
                  </tr>
                  {isOpen ? (
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <td className="py-3 pr-4" colSpan={6}>
                        {hasDetails ? (
                          <div className="space-y-3">
                            {details.length > 0 ? (
                              <div className="overflow-auto rounded-md border border-slate-200 bg-white">
                                <table className="min-w-full text-left text-xs">
                                  <thead className="border-b border-slate-200 bg-slate-100 text-slate-500">
                                    <tr>
                                      <th className="py-2 pl-3 pr-2 font-semibold">{t.entity}</th>
                                      <th className="px-2 py-2 font-semibold">{t.before}</th>
                                      <th className="px-2 py-2 font-semibold">{t.after}</th>
                                      <th className="px-2 py-2 font-semibold">{t.changed}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {details.map((detail) => (
                                      <tr className={detail.changed ? "border-b border-amber-100 bg-amber-50" : "border-b border-slate-100"} key={detail.key}>
                                        <td className="py-2 pl-3 pr-2 font-semibold text-slate-700">{detail.key}</td>
                                        <td className="max-w-xs px-2 py-2 text-slate-600">
                                          <code className="break-words">{valueText(detail.before)}</code>
                                        </td>
                                        <td className="max-w-xs px-2 py-2 text-slate-600">
                                          <code className="break-words">{valueText(detail.after)}</code>
                                        </td>
                                        <td className="px-2 py-2 text-slate-600">{detail.changed ? t.changed : "-"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : null}
                            <div className="grid gap-3 lg:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase text-slate-500">{t.before}</p>
                              <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-white p-3 text-xs text-slate-700">{before || "-"}</pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase text-slate-500">{t.after}</p>
                              <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-white p-3 text-xs text-slate-700">{after || "-"}</pre>
                            </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">{t.noDetails}</p>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
