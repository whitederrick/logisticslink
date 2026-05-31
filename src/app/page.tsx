import { getPageLanguage, PageSearchParams, withLanguage } from "@/lib/i18n";
import { Anchor, Boxes, Gavel, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";

const text = {
  en: {
    cards: [
      {
        body: "Shippers and forwarders aggregate compatible demand by route, schedule, cargo type, and container profile.",
        icon: Boxes,
        title: "Blind co-buy pools"
      },
      {
        body: "Carriers compete after the D-14 lock opens, with bids validated against the SCFI ceiling and current lowest price.",
        icon: Gavel,
        title: "Carrier reverse auctions"
      },
      {
        body: "Participant identities and individual cargo details stay hidden outside the admin control room.",
        icon: ShieldCheck,
        title: "Role-scoped access"
      }
    ],
    cta: "Open MVP",
    eyebrow: "Demand aggregation marketplace",
    headline: "Freight co-buying with controlled data access for every logistics role.",
    signup: "Create account",
    subtitle:
      "ForwardLink groups compatible cargo demand into blind pools, opens carrier reverse auctions at the time-lock, and keeps each actor inside the data boundary they need."
  },
  ko: {
    cards: [
      {
        body: "화주와 포워더의 물량을 구간, 일정, 화물 유형, 컨테이너 조건 기준으로 묶습니다.",
        icon: Boxes,
        title: "블라인드 공동구매 풀"
      },
      {
        body: "D-14 타임락 이후 선사가 역경매로 입찰하며, SCFI 상한과 현재 최저가 기준으로 검증합니다.",
        icon: Gavel,
        title: "선사 역경매"
      },
      {
        body: "참여자 신원과 개별 화물 정보는 관리자 화면 밖에서는 노출되지 않습니다.",
        icon: ShieldCheck,
        title: "역할별 데이터 접근"
      }
    ],
    cta: "MVP 열기",
    eyebrow: "수요 집계형 물류 마켓플레이스",
    headline: "물류 역할별 데이터 접근을 통제하는 블라인드 공동구매 플랫폼.",
    signup: "회원가입",
    subtitle:
      "ForwardLink는 조건이 맞는 화물 수요를 블라인드 풀로 집계하고, 타임락에 맞춰 선사 역경매를 열며, 각 역할에 필요한 데이터만 보여줍니다."
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
          </div>

          <div className="grid gap-4">
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
