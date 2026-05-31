import { ActionButton } from "@/components/action-button";
import { StatusBadge } from "@/components/status-badge";
import { dateOnly, money } from "@/lib/format";
import { Language } from "@/lib/i18n";
import { nextShipmentStatus, shipmentProgress } from "@/lib/shipment-workflow";

export type ShipmentFollowupItem = {
  finalRateUsd: number | null;
  participantCount: number;
  podCode: string;
  polCode: string;
  poolId: number;
  status: string;
  targetEtd: Date;
  totalVolumeTeu: number;
  winningCarrierName: string | null;
};

const text = {
  en: {
    advance: {
      AWARDED: "Start shipment",
      SHIPMENT_IN_PROGRESS: "Mark completed"
    },
    empty: "No awarded shipments yet.",
    finalRate: "Final rate",
    participants: "Participants",
    route: "Route",
    targetEtd: "Target ETD",
    title: "Shipment follow-up",
    to: "to",
    volume: "Volume",
    winningCarrier: "Winning carrier"
  },
  ko: {
    advance: {
      AWARDED: "운송 시작",
      SHIPMENT_IN_PROGRESS: "완료 처리"
    },
    empty: "아직 낙찰 이후 운송 건이 없습니다.",
    finalRate: "확정 운임",
    participants: "참여자",
    route: "항로",
    targetEtd: "예정 ETD",
    title: "운송 후속 관리",
    to: "→",
    volume: "물량",
    winningCarrier: "낙찰 선사"
  }
} as const;

export function ShipmentFollowupBoard({
  canAdvance = false,
  language,
  shipments,
  title
}: {
  canAdvance?: boolean;
  language: Language;
  shipments: ShipmentFollowupItem[];
  title?: string;
}) {
  const t = text[language];

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title ?? t.title}</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {shipments.length === 0 ? <p className="text-sm text-slate-500">{t.empty}</p> : null}
        {shipments.map((shipment) => {
          const nextStatus = nextShipmentStatus(shipment.status as never);
          const advanceLabel = nextStatus ? t.advance[shipment.status as keyof typeof t.advance] : null;

          return (
            <div className="rounded-md border border-slate-200 p-4" key={shipment.poolId}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">Pool #{shipment.poolId}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {shipment.polCode} {t.to} {shipment.podCode}
                  </p>
                </div>
                <StatusBadge language={language} value={shipment.status} />
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded bg-slate-100">
                <div className="h-full bg-harbor" style={{ width: `${shipmentProgress(shipment.status)}%` }} />
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">{t.targetEtd}</dt>
                  <dd className="mt-1 font-semibold">{dateOnly(shipment.targetEtd)}</dd>
                </div>
                <div className="rounded bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">{t.finalRate}</dt>
                  <dd className="mt-1 font-semibold">{money(shipment.finalRateUsd)}</dd>
                </div>
                <div className="rounded bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">{t.volume}</dt>
                  <dd className="mt-1 font-semibold">{shipment.totalVolumeTeu} TEU</dd>
                </div>
                <div className="rounded bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">{t.participants}</dt>
                  <dd className="mt-1 font-semibold">{shipment.participantCount}</dd>
                </div>
              </dl>

              <p className="mt-3 text-sm text-slate-500">
                {t.winningCarrier}: {shipment.winningCarrierName ?? "-"}
              </p>

              {canAdvance && nextStatus && advanceLabel ? (
                <div className="mt-4">
                  <ActionButton body={{ status: nextStatus }} url={`/api/admin/pools/${shipment.poolId}/shipment-status`}>
                    {advanceLabel}
                  </ActionButton>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
