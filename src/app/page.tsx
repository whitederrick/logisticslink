import { Anchor, Boxes, Gavel, ShieldCheck } from "lucide-react";

const cards = [
  {
    title: "공동구매 풀",
    body: "같은 항로, 일정, 화물 조건의 물량을 하나의 풀로 묶어 운임 협상력을 높입니다.",
    icon: Boxes
  },
  {
    title: "선사 역경매",
    body: "모집이 끝난 물량을 기준으로 선사가 경쟁 입찰하고 가장 적합한 운임을 제안합니다.",
    icon: Gavel
  },
  {
    title: "정보 비공개",
    body: "참여사의 신원과 개별 물량은 보호하고, 운영에 필요한 집계 정보만 노출합니다.",
    icon: ShieldCheck
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-deck text-ink">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-harbor text-white">
              <Anchor size={22} />
            </div>
            <div>
              <p className="text-lg font-semibold">ForwardLink</p>
              <p className="text-sm text-slate-500">Co-buying Digital Forwarding</p>
            </div>
          </div>
          <a className="rounded bg-ink px-4 py-2 text-sm font-medium text-white" href="/dashboard">
            대시보드
          </a>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-harbor">
              Demand aggregation marketplace
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight">
              중소 물량을 묶어 선사 운임 경쟁을 만드는 플랫폼
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              ForwardLink는 화주와 포워더의 분산된 국제운송 수요를 공동구매 풀로 집계하고,
              선사 역경매를 통해 더 나은 운임과 실행 흐름을 제공합니다.
            </p>
          </div>

          <div className="grid gap-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
