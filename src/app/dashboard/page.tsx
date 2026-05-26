const metrics = [
  ["진행 중 견적", "12"],
  ["모집 중 공동구매", "6"],
  ["경매 중 풀", "3"],
  ["낙찰 완료", "9"]
];

const sprintItems = [
  "역할별 로그인과 대시보드",
  "해상 FCL/LCL 견적 요청",
  "공동구매 풀 생성",
  "조건 기반 공동구매 추천"
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-deck px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-harbor">ForwardLink MVP</p>
          <h1 className="mt-2 text-3xl font-semibold">운영 대시보드</h1>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Sprint 1 범위</h2>
          <div className="mt-4 grid gap-3 text-slate-600 md:grid-cols-2">
            {sprintItems.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
