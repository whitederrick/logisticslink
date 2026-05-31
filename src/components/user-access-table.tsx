"use client";

import { StatusBadge } from "@/components/status-badge";
import { Language } from "@/lib/i18n";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type UserAccessRow = {
  businessNumber: string;
  companyNameEn: string;
  companyNameKr: string | null;
  email: string;
  id: number;
  role: "ADMIN" | "CARRIER" | "FORWARDER" | "SHIPPER";
  status: string;
};

type Draft = {
  reason: string;
  status: string;
};

const text = {
  en: {
    actions: "Actions",
    actorSelf: "Current admin",
    allStatuses: "All",
    company: "Company",
    filter: "Filter",
    reason: "Reason",
    reasonPlaceholder: "Approval note or restriction reason",
    role: "Role",
    saved: "Saved.",
    saving: "Saving...",
    status: "Status",
    update: "Update status"
  },
  ko: {
    actions: "관리",
    actorSelf: "본인 계정",
    allStatuses: "전체",
    company: "회사",
    filter: "필터",
    reason: "사유",
    reasonPlaceholder: "승인 메모 또는 제한 사유",
    role: "역할",
    saved: "저장됨",
    saving: "저장 중...",
    status: "상태",
    update: "상태 저장"
  }
} as const;

const roleLabels = {
  en: { ADMIN: "Admin", CARRIER: "Carrier", FORWARDER: "Forwarder", SHIPPER: "Shipper" },
  ko: { ADMIN: "관리자", CARRIER: "선사", FORWARDER: "포워더", SHIPPER: "화주" }
} as const;

const statusOptions = ["PENDING_APPROVAL", "ACTIVE", "RESTRICTED", "SUSPENDED", "LOCKED"] as const;
const filterOptions = ["ALL", ...statusOptions] as const;

export function UserAccessTable({
  adminId,
  language,
  users
}: {
  adminId: number;
  language: Language;
  users: UserAccessRow[];
}) {
  const router = useRouter();
  const t = text[language];
  const [drafts, setDrafts] = useState<Record<number, Draft>>(
    Object.fromEntries(users.map((user) => [user.id, { reason: "", status: user.status }]))
  );
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [messageById, setMessageById] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState<(typeof filterOptions)[number]>("ALL");

  const statusCounts = useMemo(
    () =>
      Object.fromEntries(
        statusOptions.map((status) => [status, users.filter((user) => user.status === status).length])
      ) as Record<(typeof statusOptions)[number], number>,
    [users]
  );
  const filteredUsers = statusFilter === "ALL" ? users : users.filter((user) => user.status === statusFilter);

  function updateDraft(userId: number, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [userId]: { ...current[userId], ...patch } }));
  }

  async function save(user: UserAccessRow) {
    const draft = drafts[user.id];
    if (!draft) return;

    setPendingId(user.id);
    setMessageById((current) => ({ ...current, [user.id]: "" }));

    try {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: draft.reason,
          status: draft.status
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? `Request failed with ${response.status}`);
      }

      setMessageById((current) => ({ ...current, [user.id]: t.saved }));
      router.refresh();
    } catch (error) {
      setMessageById((current) => ({ ...current, [user.id]: error instanceof Error ? error.message : "UPDATE_FAILED" }));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              className={`rounded-md border px-3 py-2 text-xs font-semibold ${
                statusFilter === status ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-600"
              }`}
              key={status}
              onClick={() => setStatusFilter(status)}
              type="button"
            >
              {status.replaceAll("_", " ")} {statusCounts[status]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          {t.filter}
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3"
            onChange={(event) => setStatusFilter(event.target.value as (typeof filterOptions)[number])}
            value={statusFilter}
          >
            {filterOptions.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? t.allStatuses : status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <table className="mt-4 min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
          <tr>
            <th className="py-2 pr-4 font-semibold">{t.company}</th>
            <th className="py-2 pr-4 font-semibold">{t.role}</th>
            <th className="py-2 pr-4 font-semibold">{t.status}</th>
            <th className="py-2 pr-4 font-semibold">{t.reason}</th>
            <th className="py-2 pr-4 font-semibold">{t.actions}</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => {
            const draft = drafts[user.id] ?? { reason: "", status: user.status };
            const isSelf = user.id === adminId;
            const isPending = pendingId === user.id;

            return (
              <tr className="border-b border-slate-100 align-top" key={user.id}>
                <td className="py-3 pr-4">
                  <p className="font-semibold">{user.companyNameKr ?? user.companyNameEn}</p>
                  <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                  <p className="mt-1 text-xs text-slate-500">{user.businessNumber}</p>
                </td>
                <td className="py-3 pr-4 text-slate-600">{roleLabels[language][user.role]}</td>
                <td className="py-3 pr-4">
                  <div className="grid min-w-44 gap-2">
                    <StatusBadge language={language} value={user.status} />
                    {!isSelf ? (
                      <select
                        className="h-10 rounded-md border border-slate-300 bg-white px-3"
                        disabled={isPending}
                        onChange={(event) => updateDraft(user.id, { status: event.target.value })}
                        value={draft.status}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  {isSelf ? (
                    <p className="text-xs text-slate-500">{t.actorSelf}</p>
                  ) : (
                    <input
                      className="h-10 min-w-72 rounded-md border border-slate-300 px-3"
                      disabled={isPending}
                      maxLength={240}
                      onChange={(event) => updateDraft(user.id, { reason: event.target.value })}
                      placeholder={t.reasonPlaceholder}
                      value={draft.reason}
                    />
                  )}
                </td>
                <td className="py-3 pr-4">
                  {!isSelf ? (
                    <div className="flex flex-col gap-1">
                      <button
                        aria-label={t.update}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-ink text-white disabled:opacity-50"
                        disabled={isPending}
                        onClick={() => save(user)}
                        title={t.update}
                        type="button"
                      >
                        <Check size={16} />
                      </button>
                      {messageById[user.id] ? <p className="text-xs text-slate-500">{messageById[user.id]}</p> : null}
                    </div>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
