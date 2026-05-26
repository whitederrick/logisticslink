const metrics = [
  ["吏꾪뻾 以?寃ъ쟻", "12"],
  ["紐⑥쭛 以?怨듬룞援щℓ", "6"],
  ["寃쎈ℓ 以?, "3"],
  ["?숈같 ?꾨즺", "9"]
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-deck px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-harbor">ForwardLink MVP</p>
          <h1 className="mt-2 text-3xl font-semibold">?댁쁺 ??쒕낫??/h1>
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
          <h2 className="text-xl font-semibold">Sprint 1 踰붿쐞</h2>
          <div className="mt-4 grid gap-3 text-slate-600 md:grid-cols-2">
            <p>??븷蹂?濡쒓렇?멸낵 ??쒕낫??/p>
            <p>?댁긽 FCL/LCL 寃ъ쟻 ?붿껌</p>
            <p>怨듬룞援щℓ ? ?앹꽦</p>
            <p>議곌굔 湲곕컲 怨듬룞援щℓ 異붿쿇</p>
          </div>
        </section>
      </div>
    </main>
  );
}
