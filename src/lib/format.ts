import { Language } from "@/lib/i18n";

export function money(value: unknown) {
  if (value == null) return "-";
  return `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

const statusLabels = {
  en: {
    ACTIVE: "Active",
    AGGREGATING: "Aggregating",
    AUCTION: "Auction",
    AWARDED: "Awarded",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
    CONFIRMED: "Confirmed",
    DRAFT: "Draft",
    FAILED: "Failed",
    JOINED: "Joined",
    LOCKED: "Locked",
    MATCHED_TO_POOL: "Matched to pool",
    NO_SHOW: "No-show",
    PENDING_APPROVAL: "Pending approval",
    PENDING_PROFILE: "Pending profile",
    RESTRICTED: "Restricted",
    SHIPMENT_IN_PROGRESS: "Shipment in progress",
    STANDALONE: "Standalone",
    SUBMITTED: "Submitted",
    SUSPENDED: "Suspended"
  },
  ko: {
    ACTIVE: "활성",
    AGGREGATING: "공동구매 집계",
    AUCTION: "역경매 진행",
    AWARDED: "낙찰",
    CANCELLED: "취소",
    COMPLETED: "완료",
    CONFIRMED: "확정",
    DRAFT: "임시 저장",
    FAILED: "실패",
    JOINED: "참여",
    LOCKED: "잠김",
    MATCHED_TO_POOL: "풀 매칭",
    NO_SHOW: "미이행",
    PENDING_APPROVAL: "승인 대기",
    PENDING_PROFILE: "프로필 대기",
    RESTRICTED: "제한",
    SHIPMENT_IN_PROGRESS: "운송 진행",
    STANDALONE: "단독 견적",
    SUBMITTED: "접수",
    SUSPENDED: "정지"
  }
} as const;

export function statusLabel(value: string, language: Language) {
  return statusLabels[language][value as keyof (typeof statusLabels)[typeof language]] ?? value;
}

export function statusTone(value: string) {
  if (value === "AUCTION") return "border-amber-200 bg-amber-50 text-amber-700";
  if (value === "AGGREGATING" || value === "SUBMITTED" || value === "PENDING_APPROVAL") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  if (value === "AWARDED" || value === "COMPLETED" || value === "MATCHED_TO_POOL" || value === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value === "FAILED" || value === "CANCELLED" || value === "LOCKED" || value === "SUSPENDED" || value === "RESTRICTED") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}
