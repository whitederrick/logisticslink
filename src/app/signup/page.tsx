import { AppShell } from "@/components/app-shell";
import { SignupForm } from "@/components/signup-form";
import { getPageLanguage, PageSearchParams } from "@/lib/i18n";

const text = {
  en: {
    subtitle: "Create a company account with country, business category, duplicate checks, and required terms confirmation.",
    title: "Company signup"
  },
  ko: {
    subtitle: "국가, 업종, 이메일과 사업자번호 중복 확인, 약관 스크롤 동의를 포함해 기업 계정을 신청합니다.",
    title: "기업 회원가입"
  }
} as const;

export default async function SignupPage({ searchParams }: { searchParams: PageSearchParams }) {
  const language = await getPageLanguage(searchParams);
  const t = text[language];

  return (
    <AppShell active="/signup" language={language} subtitle={t.subtitle} title={t.title}>
      <SignupForm language={language} />
    </AppShell>
  );
}
