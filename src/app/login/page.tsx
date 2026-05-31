import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/components/login-form";
import { getPageLanguage, PageSearchParams } from "@/lib/i18n";

const text = {
  en: {
    registeredSubtitle: "Sign in with a registered company account to enter the correct role workspace.",
    subtitle: "Sign in with a demo or registered company account to enter the correct role workspace.",
    title: "Login"
  },
  ko: {
    registeredSubtitle: "가입한 기업 계정으로 로그인하면 역할에 맞는 작업 화면으로 이동합니다.",
    subtitle: "데모 계정 또는 가입한 기업 계정으로 로그인하면 역할에 맞는 작업 화면으로 이동합니다.",
    title: "로그인"
  }
} as const;

export default async function LoginPage({ searchParams }: { searchParams: PageSearchParams }) {
  const language = await getPageLanguage(searchParams);
  const t = text[language];
  const enableDemoLogin = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== "false";

  return (
    <AppShell active="/login" language={language} subtitle={enableDemoLogin ? t.subtitle : t.registeredSubtitle} title={t.title}>
      <LoginForm enableDemoLogin={enableDemoLogin} language={language} />
    </AppShell>
  );
}
