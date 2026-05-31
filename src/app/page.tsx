import { getPageLanguage, PageSearchParams, withLanguage } from "@/lib/i18n";
import { Anchor, Boxes, CheckCircle2, ClipboardList, Gavel, LogIn, PackageCheck, UserPlus } from "lucide-react";
import Link from "next/link";

const text = {
  en: {
    cards: [
      {
        body: "Shippers and forwarders register freight demand with route, ETD, cargo, and container details.",
        icon: ClipboardList,
        title: "1. Register cargo"
      },
      {
        body: "Compatible demand is grouped into blind co-buy pools without exposing participant identities.",
        icon: Boxes,
        title: "2. Aggregate pools"
      },
      {
        body: "Carriers bid after the time-lock opens, and admin closes the auction to award the best valid rate.",
        icon: Gavel,
        title: "3. Auction and award"
      },
      {
        body: "Awarded shipments move through in-progress and completed follow-up states.",
        icon: PackageCheck,
        title: "4. Shipment follow-up"
      }
    ],
    cta: "View MVP scenario",
    eyebrow: "Demand aggregation marketplace",
    headline: "Freight co-buying with controlled data access for every logistics role.",
    login: "Login",
    signup: "Create account",
    subtitle:
      "ForwardLink is organized as one operating flow: register cargo, aggregate demand, open a reverse auction, award the shipment, and track follow-up."
  },
  ko: {
    cards: [
      {
        body: "화주와 포워더가 항로, ETD, 화물, 컨테이너 조건을 입력해 운송 수요를 등록합니다.",
        icon: ClipboardList,
        title: "1. 화물 등록"
      },
      {
        body: "조건이 맞는 수요를 블라인드 공동구매 풀로 묶고 참여자 신원은 숨깁니다.",
        icon: Boxes,
        title: "2. 공동구매 집계"
      },
      {
        body: "타임락 이후 선사가 낮은 운임으로 입찰하고, 관리자가 최저 유효 입찰을 낙찰합니다.",
        icon: Gavel,
        title: "3. 역경매와 낙찰"
      },
      {
        body: "낙찰된 건은 운송 시작과 완료 상태로 후속 관리합니다.",
        icon: PackageCheck,
        title: "4. 운송 후속"
      }
    ],
    cta: "MVP 시나리오 보기",
    eyebrow: "수요 집계형 물류 마켓플레이스",
    headline: "화물 등록부터 낙찰 이후 운송 후속까지 한 흐름으로 보는 MVP.",
    login: "로그인",
    signup: "회원가입",
    subtitle:
      "ForwardLink는 화물 등록, 공동구매 집계, 타임락, 선사 역경매, 낙찰 확정, 운송 후속 관리를 하나의 운영 절차로 묶습니다."
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
              <p className="text-lg font-semibold">ForwardLink</p>
              <p className="text-sm text-slate-500">Co-buying Digital Forwarding</p>
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

          <div className="grid gap-4 sm:grid-cols-2">
            {t.cards.map((card) => {
              const Icon = card.icon;
              return (
                <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={card.title}>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded bg-harbor/10 text-harbor">
                      <Icon size={20} />
                    </div>
                    <h2 className="text-lg font-semibold">{card.title}</h2>
                  </div>
                  <p className="leading-7 text-slate-600">{card.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
