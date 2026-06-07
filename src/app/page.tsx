import { getPageLanguage, PageSearchParams, withLanguage } from "@/lib/i18n";
import { activeService, platform, services } from "@/lib/product";
import { Anchor, Boxes, CheckCircle2, ClipboardList, Gavel, LockKeyhole, LogIn, PackageCheck, Plane, Truck, UserPlus, Warehouse } from "lucide-react";
import Link from "next/link";

const serviceIcons = [Anchor, Plane, Truck, Warehouse] as const;

const text = {
  en: {
    cards: [
      {
        body: "Visitors enter through login or signup, and admin controls which companies can operate.",
        icon: LockKeyhole,
        title: "1. Entry control"
      },
      {
        body: "Shippers and forwarders register freight demand with route, ETD, cargo, and container details.",
        icon: ClipboardList,
        title: "2. Register cargo"
      },
      {
        body: "Compatible demand is grouped into blind co-buy pools without exposing participant identities.",
        icon: Boxes,
        title: "3. Aggregate pools"
      },
      {
        body: "The time-lock opens auction windows so carriers can bid against validated benchmark ceilings.",
        icon: Gavel,
        title: "4. Time-lock auction"
      },
      {
        body: "Admin closes the auction and awards the shipment to the lowest valid bid.",
        icon: CheckCircle2,
        title: "5. Award"
      },
      {
        body: "Awarded shipments move through in-progress and completed follow-up states.",
        icon: PackageCheck,
        title: "6. Follow-up"
      }
    ],
    cta: "View MVP scenes",
    eyebrow: `${activeService.name} · Active service`,
    headline: "One logistics platform, starting with ocean freight co-buying.",
    login: "Login",
    planned: "Planned",
    serviceCatalog: "Service portfolio",
    signup: "Create account",
    subtitle:
      `${platform.name} connects multiple logistics services. ${activeService.name} is the first active service and is organized as six MVP scenes: entry control, cargo demand, blind aggregation, time-lock auction, award, and shipment follow-up.`
  },
  ko: {
    cards: [
      {
        body: "방문자는 로그인 또는 회원가입으로 진입하고, 관리자는 운영 가능한 업체를 제어합니다.",
        icon: LockKeyhole,
        title: "1. 진입 제어"
      },
      {
        body: "화주와 포워더가 항로, ETD, 화물, 컨테이너 조건을 입력해 운송 수요를 등록합니다.",
        icon: ClipboardList,
        title: "2. 화물 등록"
      },
      {
        body: "조건이 맞는 수요를 블라인드 공동구매 풀로 묶고 참여자 신원은 숨깁니다.",
        icon: Boxes,
        title: "3. 공동구매 집계"
      },
      {
        body: "타임락으로 경매 구간을 열고 선사는 기준 운임 상한 안에서 낮은 운임을 입찰합니다.",
        icon: Gavel,
        title: "4. 타임락 경매"
      },
      {
        body: "관리자는 경매를 마감하고 최저 유효 입찰을 낙찰로 확정합니다.",
        icon: CheckCircle2,
        title: "5. 낙찰 확정"
      },
      {
        body: "낙찰된 건은 운송 시작과 완료 상태로 후속 관리합니다.",
        icon: PackageCheck,
        title: "6. 운송 후속"
      }
    ],
    cta: "MVP 장면 보기",
    eyebrow: `${activeService.name} · 운영 중인 서비스`,
    headline: "하나의 물류 플랫폼, 해상 공동구매부터 시작합니다.",
    login: "로그인",
    planned: "준비 중",
    serviceCatalog: "서비스 포트폴리오",
    signup: "회원가입",
    subtitle:
      `${platform.name}는 여러 물류 서비스를 하나의 체계로 연결합니다. 첫 운영 서비스인 ${activeService.name}는 진입 제어, 화물 수요, 블라인드 집계, 타임락 경매, 낙찰, 운송 후속의 여섯 장면으로 MVP를 보여줍니다.`
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
                      {isActive ? "MVP" : t.planned}
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
