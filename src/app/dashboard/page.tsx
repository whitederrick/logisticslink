import { AppShell } from "@/components/app-shell";
import { getPageLanguage, PageSearchParams, withLanguage } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { activeService } from "@/lib/product";
import { AlertTriangle, Boxes, Building2, CheckCircle2, ClipboardList, Database, Gavel, LockKeyhole, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";

const text = {
  en: {
    nextAction: "Next action",
    offlineNotice: "Live counters are unavailable until the production database and migrations are ready. The MVP scenario can still be reviewed below.",
    pipelineTitle: "Reverse-auction operating pipeline",
    scenarioTitle: "MVP demo scenes",
    subtitle:
      "LogisticsLink Ocean collects shipper cargo demand, forms blind co-buy pools, and runs reverse auctions for forwarders or carriers.",
    title: "LogisticsLink Ocean operating overview",
    workspacesTitle: "Role workspaces",
    steps: {
      quotes: {
        action: "Create or review shipper demand",
        label: "Cargo demand registered",
        unit: "quotes"
      },
      aggregating: {
        action: "Invite matching demand or wait for D-14",
        label: "Blind pools aggregating",
        unit: "pools"
      },
      auction: {
        action: "Monitor carrier bids and price movement",
        label: "Reverse auctions live",
        unit: "pools"
      },
      awarded: {
        action: "Confirm award and start shipment follow-up",
        label: "Awarded or completed",
        unit: "pools"
      }
    },
    scenes: [
      {
        action: "Use demo credentials or create a company account, then confirm the account state.",
        actor: "Visitor / Admin",
        proof: "Signup checks duplicate email and business number; inactive accounts see a status notice.",
        title: "Entry and access control",
        workspace: "/signup, /login, /admin"
      },
      {
        action: "Register route, ETD, cargo type, container, quantity, and weight for a shipment need.",
        actor: "Shipper / Forwarder",
        proof: "The quote is stored under the requester role and appears only in the allowed workspace.",
        title: "Cargo demand registration",
        workspace: "/shipper, /forwarder"
      },
      {
        action: "Review recommended co-buy pools or create a new pool from the quote.",
        actor: "Shipper / Forwarder",
        proof: "Matching keeps participant identities masked while aggregating compatible demand.",
        title: "Blind pool aggregation",
        workspace: "/shipper, /forwarder"
      },
      {
        action: "Run the time-lock transition, then let carriers inspect auction-ready pools and bid lower.",
        actor: "Admin / Carrier",
        proof: "D-14 opens the auction, bid validation applies the benchmark ceiling and current lowest bid.",
        title: "Time-lock and reverse auction",
        workspace: "/admin, /carrier"
      },
      {
        action: "Close the auction and award the lowest valid bid.",
        actor: "Admin",
        proof: "The winning carrier is recorded and the pool moves from auction to awarded.",
        title: "Award confirmation",
        workspace: "/admin"
      },
      {
        action: "Advance the awarded shipment through in-progress and completed states.",
        actor: "Admin / All roles",
        proof: "Operational users can see shipment follow-up status without exposing restricted data.",
        title: "Shipment follow-up",
        workspace: "/admin, role workspaces"
      }
    ],
    workspaces: [
      {
        body: "Enter with a demo or registered account. Each account lands on its role workspace.",
        href: "/login",
        icon: LogIn,
        label: "Login"
      },
      {
        body: "Create a company account with duplicate checks, required terms confirmation, and admin approval status.",
        href: "/signup",
        icon: UserPlus,
        label: "Signup"
      },
      {
        body: "Register cargo demand, review owned quotes, and join recommended co-buy pools.",
        href: "/shipper",
        icon: Boxes,
        label: "Cargo demand"
      },
      {
        body: "Submit customer cargo under a forwarder account while participant identities stay masked.",
        href: "/forwarder",
        icon: Building2,
        label: "Forwarder"
      },
      {
        body: "Review auction-ready pools and place lower bids inside the time-lock window.",
        href: "/carrier",
        icon: Gavel,
        label: "Auction board"
      },
      {
        body: "Run time-lock transitions, inspect participants, and close auctions.",
        href: "/admin",
        icon: ShieldCheck,
        label: "Operations"
      }
    ]
  },
  ko: {
    nextAction: "다음 액션",
    offlineNotice: "운영 DB와 마이그레이션이 준비되기 전에는 실시간 지표를 불러오지 못할 수 있습니다. 아래 MVP 시나리오는 계속 확인할 수 있습니다.",
    pipelineTitle: "역경매 운영 파이프라인",
    scenarioTitle: "MVP 데모 장면",
    subtitle: "LogisticsLink Ocean은 화주의 해상 화물을 모아 블라인드 공동구매 풀을 만들고, 포워더 또는 선사를 대상으로 역경매를 진행합니다.",
    title: "LogisticsLink Ocean 운영 현황",
    workspacesTitle: "역할별 작업 화면",
    steps: {
      quotes: {
        action: "화주 수요를 등록하거나 기존 견적을 확인",
        label: "등록된 화물 수요",
        unit: "건"
      },
      aggregating: {
        action: "매칭 수요를 모으거나 D-14 타임락 대기",
        label: "집계 중인 블라인드 풀",
        unit: "개"
      },
      auction: {
        action: "입찰 수와 최저가 변동 모니터링",
        label: "진행 중인 역경매",
        unit: "개"
      },
      awarded: {
        action: "낙찰 확정 후 운송 후속 관리",
        label: "낙찰 또는 완료",
        unit: "개"
      }
    },
    scenes: [
      {
        action: "데모 계정으로 로그인하거나 기업 계정을 신청한 뒤 계정 상태를 확인합니다.",
        actor: "방문자 / 관리자",
        proof: "회원가입에서 이메일과 사업자번호 중복을 확인하고, 비활성 계정은 상태 안내를 봅니다.",
        title: "진입과 접근 제어",
        workspace: "/signup, /login, /admin"
      },
      {
        action: "운송 구간, ETD, 화물 유형, 컨테이너, 수량, 중량을 입력해 수요를 등록합니다.",
        actor: "화주 / 포워더",
        proof: "견적은 요청자 역할로 저장되고 허용된 작업 화면에서만 보입니다.",
        title: "화물 수요 등록",
        workspace: "/shipper, /forwarder"
      },
      {
        action: "추천 공동구매 풀을 확인하거나 해당 견적으로 새 풀을 만듭니다.",
        actor: "화주 / 포워더",
        proof: "조건이 맞는 수요를 묶되 참여자 신원은 계속 마스킹됩니다.",
        title: "블라인드 풀 집계",
        workspace: "/shipper, /forwarder"
      },
      {
        action: "타임락 전환을 실행한 뒤 선사가 경매 가능 풀을 보고 더 낮은 운임으로 입찰합니다.",
        actor: "관리자 / 선사",
        proof: "D-14에 경매가 열리고, 기준 운임 상한과 현재 최저가 검증이 적용됩니다.",
        title: "타임락과 역경매",
        workspace: "/admin, /carrier"
      },
      {
        action: "경매를 마감하고 최저 유효 입찰을 낙찰로 확정합니다.",
        actor: "관리자",
        proof: "낙찰 선사가 기록되고 풀 상태가 경매에서 낙찰로 전환됩니다.",
        title: "낙찰 확정",
        workspace: "/admin"
      },
      {
        action: "낙찰된 운송 건을 진행 중, 완료 상태로 전환합니다.",
        actor: "관리자 / 전체 역할",
        proof: "역할별 사용자는 제한된 데이터만 보면서 운송 후속 상태를 확인합니다.",
        title: "운송 후속 관리",
        workspace: "/admin, 역할별 화면"
      }
    ],
    workspaces: [
      {
        body: "데모 계정 또는 가입 계정으로 로그인합니다. 로그인 후 역할에 맞는 작업 화면으로 이동합니다.",
        href: "/login",
        icon: LogIn,
        label: "로그인"
      },
      {
        body: "이메일과 사업자번호 중복 확인, 약관 동의, 관리자 승인 상태까지 포함해 기업 계정을 신청합니다.",
        href: "/signup",
        icon: UserPlus,
        label: "회원가입"
      },
      {
        body: "화물 수요를 등록하고, 내 견적과 추천 공동구매 풀 참여 흐름을 확인합니다.",
        href: "/shipper",
        icon: Boxes,
        label: "화물 등록"
      },
      {
        body: "고객 화물을 포워더 계정으로 등록하되, 다른 참여자의 신원은 마스킹됩니다.",
        href: "/forwarder",
        icon: Building2,
        label: "포워더"
      },
      {
        body: "타임락 구간 안에서 경매 풀을 확인하고 더 낮은 운임을 입찰합니다.",
        href: "/carrier",
        icon: Gavel,
        label: "역경매"
      },
      {
        body: "타임락 전환, 참여자 확인, 입찰 감사, 경매 마감을 실행합니다.",
        href: "/admin",
        icon: ShieldCheck,
        label: "운영 관리"
      }
    ]
  }
} as const;

async function safeCount(query: () => Promise<number>) {
  try {
    return await query();
  } catch {
    return null;
  }
}

export default async function DashboardPage({ searchParams }: { searchParams: PageSearchParams }) {
  const language = await getPageLanguage(searchParams);
  const t = text[language];

  const [quoteCount, aggregatingCount, auctionCount, awardedCount] = await Promise.all([
    safeCount(() => prisma.quote.count({ where: { serviceCode: activeService.code } })),
    safeCount(() => prisma.coBuyPool.count({ where: { serviceCode: activeService.code, status: "AGGREGATING" } })),
    safeCount(() => prisma.coBuyPool.count({ where: { serviceCode: activeService.code, status: "AUCTION_LIVE" } })),
    safeCount(() => prisma.coBuyPool.count({ where: { serviceCode: activeService.code, status: { in: ["AWARDED", "IN_SHIPMENT", "COMPLETED"] } } }))
  ]);
  const hasLiveCounts = [quoteCount, aggregatingCount, auctionCount, awardedCount].every((count) => count !== null);

  const pipeline = [
    { count: quoteCount, href: "/shipper", icon: ClipboardList, step: t.steps.quotes },
    { count: aggregatingCount, href: "/shipper", icon: Boxes, step: t.steps.aggregating },
    { count: auctionCount, href: "/carrier", icon: Gavel, step: t.steps.auction },
    { count: awardedCount, href: "/admin", icon: CheckCircle2, step: t.steps.awarded }
  ];

  return (
    <AppShell active="/dashboard" language={language} subtitle={t.subtitle} title={t.title}>
      {!hasLiveCounts ? (
        <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={20} />
            <p className="text-sm leading-6">{t.offlineNotice}</p>
          </div>
        </section>
      ) : null}

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Database className="text-harbor" size={20} />
          <h2 className="text-lg font-semibold">{t.scenarioTitle}</h2>
        </div>
        <ol className="mt-4 grid gap-3 lg:grid-cols-2">
          {t.scenes.map((scene, index) => (
            <li className="rounded-md border border-slate-200 bg-slate-50 p-4" key={scene.title}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded bg-ink text-xs font-semibold text-white">{index + 1}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{scene.title}</h3>
                    <p className="mt-1 text-xs font-medium text-harbor">{scene.actor}</p>
                  </div>
                </div>
                <span className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-500">{scene.workspace}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">{scene.action}</p>
              <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">{scene.proof}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <LockKeyhole className="text-harbor" size={20} />
          <h2 className="text-lg font-semibold">{t.pipelineTitle}</h2>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          {pipeline.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link className="rounded-md border border-slate-200 bg-slate-50 p-4 hover:border-harbor" href={withLanguage(item.href, language)} key={item.step.label}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded bg-harbor/10 text-harbor">
                    <Icon size={18} />
                  </span>
                  <span className="text-xs font-semibold text-slate-400">STEP {index + 1}</span>
                </div>
                <p className="mt-3 text-sm text-slate-500">{item.step.label}</p>
                <p className="mt-1 text-3xl font-semibold">
                  {item.count ?? "-"}
                  <span className="ml-1 text-sm font-medium text-slate-500">{item.step.unit}</span>
                </p>
                <p className="mt-3 text-xs font-medium text-harbor">
                  {t.nextAction}: {item.step.action}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">{t.workspacesTitle}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {t.workspaces.map((workspace) => {
            const Icon = workspace.icon;
            return (
              <Link
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-harbor hover:bg-teal-50"
                href={withLanguage(workspace.href, language)}
                key={workspace.href}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-harbor/10 text-harbor">
                    <Icon size={20} />
                  </span>
                  <h3 className="text-lg font-semibold">{workspace.label}</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{workspace.body}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
