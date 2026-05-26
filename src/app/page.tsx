import { Anchor, Boxes, Gavel, ShieldCheck } from "lucide-react";

const cards = [
  {
    title: "怨듬룞援щℓ ?",
    body: "?숈씪 援ш컙, ?쇱젙, 臾쇱꽦 議곌굔???붿＜ 臾쇰웾??釉붾씪?몃뱶濡?吏묎퀎?⑸땲??",
    icon: Boxes
  },
  {
    title: "?좎궗 ??꼍留?,
    body: "D-14遺??D-7源뚯? ?좎궗媛 吏묎퀎 臾쇰웾??????댁엫???ъ같?⑸땲??",
    icon: Gavel
  },
  {
    title: "?뺣낫 鍮꾨?移?,
    body: "李몄뿬???좎썝怨?媛쒕퀎 臾쇰웾? ?④린怨??꾩슂??吏묎퀎 ?뺣낫留??쒓났?⑸땲??",
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
            ??쒕낫??          </a>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-harbor">
              Demand aggregation marketplace
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight">
              以묒냼??臾쇰웾??臾띠뼱 ?좎궗 ?댁엫 寃쎌웳??留뚮뱶???뚮옯??            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              ForwardLink???붿＜? ?ъ썙?붿쓽 ?뚰렪?붾맂 臾쇰웾??怨듬룞援щℓ ?濡?吏묎퀎?섍퀬,
              ?좎궗????꼍留??낆같???듯빐 ???섏? ?댁엫怨??ㅽ뻾 ?먮쫫???쒓났?⑸땲??
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
