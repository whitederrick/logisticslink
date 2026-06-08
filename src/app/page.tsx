import { getPageLanguage, PageSearchParams, withLanguage } from "@/lib/i18n";
import { activeService, platform, services } from "@/lib/product";
import { Anchor, Boxes, CheckCircle2, ClipboardList, Gavel, LockKeyhole, LogIn, PackageCheck, Plane, Truck, UserPlus, Warehouse } from "lucide-react";
import Link from "next/link";

const serviceIcons = [Anchor, Plane, Truck, Warehouse] as const;

const text = {
  en: {
    cards: [
      {
        body: "Companies sign up, pass account review, and operate only inside their approved role.",
        icon: LockKeyhole,
        title: "1. Company onboarding"
      },
      {
        body: "Shippers and forwarders register freight demand with route, ETD, cargo, container, quantity, and weight.",
        icon: ClipboardList,
        title: "2. Demand intake"
      },
      {
        body: "Compatible demand is grouped into blind co-buy pools without exposing participant identities.",
        icon: Boxes,
        title: "3. Blind aggregation"
      },
      {
        body: "Auction windows open under a time-lock policy, and bids are validated against freight benchmarks.",
        icon: Gavel,
        title: "4. Reverse auction"
      },
      {
        body: "Operations closes the auction, records the winning carrier, and confirms the awarded shipment.",
        icon: CheckCircle2,
        title: "5. Award control"
      },
      {
        body: "Awarded shipments move through contracted, in-shipment, completed, or exception states.",
        icon: PackageCheck,
        title: "6. Shipment execution"
      }
    ],
    cta: "View service workflow",
    eyebrow: `${activeService.name} · Active service`,
    headline: "A live operating platform for ocean freight procurement.",
    login: "Login",
    operational: "Active",
    planned: "Planned",
    serviceCatalog: "Service portfolio",
    signup: "Create account",
    subtitle:
      `${platform.name} connects logistics procurement, account governance, blind demand aggregation, carrier bidding, award control, and shipment follow-up. ${activeService.name} is the first active service in that operating model.`
  },
  ko: {
    cards: [
      {
        body: "기업은 가입 후 계정 검토를 거치고, 승인된 역할 안에서만 업무를 진행합니다.",
        icon: LockKeyhole,
        title: "1. 기업 온보딩"
      },
      {
        body: "화주와 포워더가 항로, ETD, 화물, 컨테이너, 수량, 중량 기준으로 운송 수요를 등록합니다.",
        icon: ClipboardList,
        title: "2. 수요 접수"
      },
      {
        body: "조건이 맞는 수요를 블라인드 공동구매 풀로 묶고 참여 기업 정보는 노출하지 않습니다.",
        icon: Boxes,
        title: "3. 블라인드 집계"
      },
      {
        body: "타임락 정책에 따라 입찰 구간을 열고, 운임 기준 대비 유효한 입찰만 검증합니다.",
        icon: Gavel,
        title: "4. 역경매"
      },
      {
        body: "운영자가 경매를 마감하고 낙찰 선사를 기록한 뒤 운송 건을 확정합니다.",
        icon: CheckCircle2,
        title: "5. 낙찰 통제"
      },
      {
        body: "낙찰 건은 계약, 운송 중, 완료, 예외 상태로 이어지며 후속 관리됩니다.",
        icon: PackageCheck,
        title: "6. 운송 실행"
      }
    ],
    cta: "서비스 흐름 보기",
    eyebrow: `${activeService.name} · 운영 서비스`,
    headline: "해상 운임 조달을 실제 운영으로 연결하는 물류 플랫폼",
    login: "로그인",
    operational: "운영 중",
    planned: "준비 중",
    serviceCatalog: "서비스 포트폴리오",
    signup: "계정 만들기",
    subtitle:
      `${platform.name}는 물류 조달, 계정 거버넌스, 블라인드 수요 집계, 선사 입찰, 낙찰 통제, 운송 후속 관리를 하나의 운영 체계로 연결합니다. ${activeService.name}은 이 운영 모델의 첫 번째 활성 서비스입니다.`
  }
} as const;

export default async function Home({ searchParams }: { searchParams: PageSearchParams }) {
  const language = await getPageLanguage(searchParams);
  const t = text[language];

  return (
    <main className="min-h-screen bg-deck text-ink">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-harbor text-white">
              <Anchor size={22} />
            </div>
            <div>
              <p className="text-lg font-semibold">{platform.name}</p>
              <p className="text-sm text-slate-500">{activeService.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" href={withLanguage("/", language === "ko" ? "en" : "ko")}>
              {language === "ko" ? "English" : "한국어"}
            </Link>
            <Link className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" href={withLanguage("/signup", language)}>
              <UserPlus size={16} />
              {t.signup}
            </Link>
            <Link className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" href={withLanguage("/login", language)}>
              <LogIn size={16} />
              {t.login}
            </Link>
            <Link className="rounded bg-ink px-4 py-2 text-sm font-medium text-white" href={withLanguage("/dashboard", language)}>
              {t.cta}
            </Link>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-harbor">{t.eyebrow}</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight">{t.headline}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{t.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="inline-flex items-center gap-2 rounded bg-ink px-5 py-3 text-sm font-semibold text-white" href={withLanguage("/dashboard", language)}>
                <CheckCircle2 size={17} />
                {t.cta}
              </Link>
              <Link className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700" href={withLanguage("/login", language)}>
                <LogIn size={17} />
                {t.login}
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {t.cards.map((card) => {
              const Icon = card.icon;
              return (
                <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={card.title}>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-harbor/10 text-harbor">
                      <Icon size={20} />
                    </div>
                    <h2 className="text-base font-semibold">{card.title}</h2>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{card.body}</p>
                </article>
              );
            })}
          </div>
        </div>

        <section className="border-t border-slate-200 py-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-harbor">{platform.name}</p>
              <h2 className="mt-1 text-2xl font-semibold">{t.serviceCatalog}</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500">{platform.description[language]}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => {
              const Icon = serviceIcons[index];
              const isActive = service.status === "active";
              return (
                <article className={`rounded-lg border p-4 ${isActive ? "border-harbor bg-teal-50" : "border-slate-200 bg-white"}`} key={service.code}>
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded ${isActive ? "bg-harbor text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Icon size={18} />
                    </span>
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${isActive ? "bg-harbor text-white" : "bg-slate-100 text-slate-500"}`}>
                      {isActive ? t.operational : t.planned}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold">{service.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{service.description[language]}</p>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
