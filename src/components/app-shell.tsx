import Link from "next/link";
import { Anchor, Boxes, CheckCircle2, ClipboardList, Gavel, LockKeyhole, LogIn, PackageCheck, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Language, withLanguage } from "@/lib/i18n";
import { activeService, platform } from "@/lib/product";

const roleNavItems = [
  ["/dashboard", { en: "Overview", ko: "전체 현황" }],
  ["/login", { en: "Login", ko: "로그인" }],
  ["/signup", { en: "Signup", ko: "회원가입" }],
  ["/shipper", { en: "Cargo demand", ko: "화물 등록" }],
  ["/forwarder", { en: "Forwarder", ko: "포워더" }],
  ["/carrier", { en: "Auction board", ko: "역경매" }],
  ["/admin", { en: "Operations", ko: "운영 관리" }]
] as const;

const roleLabels = {
  en: { ADMIN: "Admin", CARRIER: "Carrier", FORWARDER: "Forwarder", SHIPPER: "Shipper" },
  ko: { ADMIN: "관리자", CARRIER: "선사", FORWARDER: "포워더", SHIPPER: "화주" }
} as const;

const workflowItems = [
  {
    href: "/login",
    icon: LockKeyhole,
    paths: ["/login", "/signup", "/admin"],
    title: { en: "1. Entry control", ko: "1. 진입 제어" },
    body: { en: "Account state decides who can operate.", ko: "계정 상태로 운영 가능 여부를 제어합니다." }
  },
  {
    href: "/shipper",
    icon: ClipboardList,
    paths: ["/shipper", "/forwarder"],
    title: { en: "2. Register cargo", ko: "2. 화물 등록" },
    body: { en: "Shipper or forwarder submits freight demand.", ko: "화주 또는 포워더가 운송 수요를 등록합니다." }
  },
  {
    href: "/shipper",
    icon: Users,
    paths: ["/shipper", "/forwarder"],
    title: { en: "3. Aggregate pool", ko: "3. 공동구매 집계" },
    body: { en: "Compatible cargo is grouped into blind pools.", ko: "조건이 맞는 화물을 블라인드 풀로 묶습니다." }
  },
  {
    href: "/carrier",
    icon: Gavel,
    paths: ["/admin", "/carrier"],
    title: { en: "4. Time-lock auction", ko: "4. 타임락 경매" },
    body: { en: "D-14 opens bidding under rate ceilings.", ko: "D-14에 기준 운임 안에서 입찰을 엽니다." }
  },
  {
    href: "/admin",
    icon: CheckCircle2,
    paths: ["/admin"],
    title: { en: "5. Award", ko: "5. 낙찰 확정" },
    body: { en: "Admin confirms the winning bid and records outcome.", ko: "최저 유효 입찰을 낙찰로 확정합니다." }
  },
  {
    href: "/admin",
    icon: PackageCheck,
    paths: ["/admin"],
    title: { en: "6. Shipment follow-up", ko: "6. 운송 후속 관리" },
    body: { en: "Shipment status and exceptions are tracked.", ko: "운송 진행과 예외 상황을 추적합니다." }
  }
] as const;

export async function AppShell({
  active,
  children,
  language = "ko",
  subtitle,
  title
}: {
  active: string;
  children: React.ReactNode;
  language?: Language;
  subtitle: string;
  title: string;
}) {
  const currentUser = await getCurrentUser();

  return (
    <main className="min-h-screen bg-deck px-6 py-8 text-ink">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-harbor" href={withLanguage("/", language)}>
                <Anchor size={16} />
                {platform.name}
              </Link>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{activeService.name} · Ocean MVP</p>
              <h1 className="mt-1 text-3xl font-semibold">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-2">
                {currentUser ? (
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <span className="font-semibold">{currentUser.companyNameKr ?? currentUser.companyNameEn}</span>
                    <span className="ml-2 text-slate-500">{roleLabels[language][currentUser.role]}</span>
                  </div>
                ) : (
                  <Link className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" href={withLanguage("/login", language)}>
                    <LogIn size={15} />
                    {language === "ko" ? "로그인" : "Login"}
                  </Link>
                )}
                {currentUser ? (
                  <form action={`/api/auth/logout?lang=${language}`} method="post">
                    <button className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" type="submit">
                      {language === "ko" ? "로그아웃" : "Logout"}
                    </button>
                  </form>
                ) : null}
                <div className="flex w-fit overflow-hidden rounded-md border border-slate-300 bg-white text-sm font-medium">
                  {(["ko", "en"] as const).map((locale) => (
                    <Link
                      className={`px-3 py-2 ${
                        language === locale ? "bg-ink text-white" : "text-slate-700 hover:bg-slate-50"
                      }`}
                      href={withLanguage(active, locale)}
                      key={locale}
                    >
                      {locale === "ko" ? "한국어" : "English"}
                    </Link>
                  ))}
                </div>
              </div>
              <nav className="flex flex-wrap gap-2">
                {roleNavItems.map(([href, label]) => (
                  <Link
                    className={`rounded-md border px-3 py-2 text-sm font-medium ${
                      active === href
                        ? "border-ink bg-ink text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                    }`}
                    href={withLanguage(href, language)}
                    key={href}
                  >
                    {label[language]}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Boxes size={18} className="text-harbor" />
            <h2 className="text-sm font-semibold">{language === "ko" ? "메인 비즈니스 절차" : "Core business flow"}</h2>
          </div>
          <nav className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            {workflowItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.paths.includes(active as never);
              return (
                <Link
                  className={`rounded-md border p-3 text-left transition ${
                    isActive ? "border-harbor bg-teal-50" : "border-slate-200 bg-white hover:border-slate-400"
                  }`}
                  href={withLanguage(item.href, language)}
                  key={item.title.en}
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded ${isActive ? "bg-harbor text-white" : "bg-slate-100 text-slate-600"}`}>
                      <Icon size={15} />
                    </span>
                    <p className="text-sm font-semibold">{item.title[language]}</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{item.body[language]}</p>
                </Link>
              );
            })}
          </nav>
        </section>

        {children}
      </div>
    </main>
  );
}
