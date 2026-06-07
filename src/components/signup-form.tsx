"use client";

import { Language } from "@/lib/i18n";
import { businessTypes, countries } from "@/lib/master-data";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Availability = "idle" | "checking" | "available" | "taken" | "invalid";
type SignupLabels = (typeof text)[Language];

const text = {
  en: {
    account: "Account",
    available: "Available",
    businessNumber: "Business registration number",
    businessType: "Business category",
    check: "Check",
    checking: "Checking",
    company: "Company",
    companyNameEn: "Company name",
    companyNameKr: "Company name in Korean",
    country: "Country",
    created: "Signup submitted. The account is pending admin approval.",
    email: "Work email",
    failed: "Signup failed",
    invalid: "Enter a valid value first.",
    nameEn: "Contact name",
    nameKr: "Contact name in Korean",
    password: "Password",
    phone: "Phone",
    role: "Role",
    roles: {
      CARRIER: "Carrier",
      FORWARDER: "Forwarder",
      SHIPPER: "Shipper"
    },
    submit: "Submit signup",
    submitting: "Submitting",
    taken: "Already in use",
    terms:
      "LogisticsLink verifies company accounts before activation. Submitted company information may be reviewed by administrators for identity, compliance, and service eligibility. ForwardLink Ocean blind co-buy pool data exposes only route, schedule, cargo class, and aggregate volume to other participants. Carrier auction access is limited to auction-ready pools, aggregate demand, and bid status. Individual company identities and quote details are not shared outside authorized admin views. Scroll to the end and agree before submitting. End.",
    termsAgree: "I agree to the terms",
    termsRequired: "Read the terms to the end before agreeing."
  },
  ko: {
    account: "계정 정보",
    available: "사용 가능",
    businessNumber: "사업자등록번호",
    businessType: "업종",
    check: "확인",
    checking: "확인 중",
    company: "회사 정보",
    companyNameEn: "회사명 영문",
    companyNameKr: "회사명 국문",
    country: "국가",
    created: "회원가입 요청이 접수되었습니다. 관리자 승인 후 사용할 수 있습니다.",
    email: "업무 이메일",
    failed: "회원가입 실패",
    invalid: "값을 먼저 올바르게 입력해 주세요.",
    nameEn: "담당자명 영문",
    nameKr: "담당자명 국문",
    password: "비밀번호",
    phone: "연락처",
    role: "역할",
    roles: {
      CARRIER: "선사",
      FORWARDER: "포워더",
      SHIPPER: "화주"
    },
    submit: "가입 요청",
    submitting: "요청 중",
    taken: "이미 사용 중",
    terms:
      "LogisticsLink는 기업 계정 활성화 전에 회사 정보를 검토합니다. 제출된 회사 정보는 신원 확인, 컴플라이언스, 서비스 이용 자격 검토를 위해 관리자가 확인할 수 있습니다. ForwardLink Ocean 블라인드 공동구매 풀에서는 다른 참여자에게 항로, 일정, 화물 유형, 집계 물량만 공개됩니다. 선사의 경매 접근은 경매 상태의 풀, 집계 수요, 입찰 상태로 제한됩니다. 개별 회사명과 견적 상세는 승인된 관리자 화면 밖에서 공유되지 않습니다. 끝까지 스크롤한 뒤 동의해 주세요. 끝.",
    termsAgree: "약관에 동의합니다",
    termsRequired: "약관을 끝까지 읽어야 동의할 수 있습니다."
  }
} as const;

function AvailabilityMessage({ labels, state }: { labels: SignupLabels; state: Availability }) {
  if (state === "idle") return null;
  const className =
    state === "available" ? "text-emerald-700" : state === "checking" ? "text-slate-500" : "text-red-600";
  const Icon = state === "available" ? CheckCircle2 : state === "checking" ? Loader2 : XCircle;
  const message =
    state === "available"
      ? labels.available
      : state === "checking"
        ? labels.checking
        : state === "taken"
          ? labels.taken
          : labels.invalid;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${className}`}>
      <Icon className={state === "checking" ? "animate-spin" : ""} size={14} />
      {message}
    </span>
  );
}

export function SignupForm({ language }: { language: Language }) {
  const labels = text[language];
  const router = useRouter();
  const [emailState, setEmailState] = useState<Availability>("idle");
  const [businessNumberState, setBusinessNumberState] = useState<Availability>("idle");
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => emailState === "available" && businessNumberState === "available" && termsScrolled && termsAccepted && !isPending,
    [businessNumberState, emailState, isPending, termsAccepted, termsScrolled]
  );

  async function checkAvailability(field: "email" | "businessNumber", value: string) {
    const setState = field === "email" ? setEmailState : setBusinessNumberState;
    const valid = field === "email" ? /\S+@\S+\.\S+/.test(value) : value.trim().length >= 3;

    if (!valid) {
      setState("invalid");
      return;
    }

    setState("checking");
    const response = await fetch("/api/signup/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value.trim() })
    });

    if (!response.ok) {
      setState("invalid");
      return;
    }

    const result = await response.json();
    const available = field === "email" ? result.emailAvailable : result.businessNumberAvailable;
    setState(available ? "available" : "taken");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    const form = new FormData(event.currentTarget);
    setIsPending(true);
    setMessage(null);

    const payload = {
      businessNumber: form.get("businessNumber"),
      businessType: form.get("businessType"),
      companyNameEn: form.get("companyNameEn"),
      companyNameKr: form.get("companyNameKr"),
      companyRegion: form.get("companyRegion"),
      email: form.get("email"),
      nameEn: form.get("nameEn"),
      nameKr: form.get("nameKr"),
      password: form.get("password"),
      phone: form.get("phone"),
      role: form.get("role"),
      termsAccepted,
      termsScrolled
    };

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error ?? labels.failed);
      }

      setMessage(labels.created);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.failed);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="grid gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={submit}>
      <section>
        <h2 className="text-lg font-semibold">{labels.company}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            {labels.companyNameEn}
            <input className="rounded-md border border-slate-300 px-3 py-2" name="companyNameEn" required />
          </label>
          <label className="grid gap-1 text-sm">
            {labels.companyNameKr}
            <input className="rounded-md border border-slate-300 px-3 py-2" name="companyNameKr" />
          </label>
          <label className="grid gap-1 text-sm">
            {labels.country}
            <select className="rounded-md border border-slate-300 px-3 py-2" name="companyRegion" required>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            {labels.businessType}
            <select className="rounded-md border border-slate-300 px-3 py-2" name="businessType" required>
              {businessTypes.map((businessType) => (
                <option key={businessType} value={businessType}>
                  {businessType}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            {labels.businessNumber}
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2"
                name="businessNumber"
                onChange={() => setBusinessNumberState("idle")}
                required
              />
              <button
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
                onClick={(event) => {
                  const input = event.currentTarget.form?.elements.namedItem("businessNumber") as HTMLInputElement | null;
                  void checkAvailability("businessNumber", input?.value ?? "");
                }}
                type="button"
              >
                {labels.check}
              </button>
            </div>
            <AvailabilityMessage labels={labels} state={businessNumberState} />
          </label>
          <label className="grid gap-1 text-sm">
            {labels.role}
            <select className="rounded-md border border-slate-300 px-3 py-2" name="role" required>
              {(["SHIPPER", "FORWARDER", "CARRIER"] as const).map((role) => (
                <option key={role} value={role}>
                  {labels.roles[role]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">{labels.account}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            {labels.email}
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2"
                name="email"
                onChange={() => setEmailState("idle")}
                required
                type="email"
              />
              <button
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
                onClick={(event) => {
                  const input = event.currentTarget.form?.elements.namedItem("email") as HTMLInputElement | null;
                  void checkAvailability("email", input?.value ?? "");
                }}
                type="button"
              >
                {labels.check}
              </button>
            </div>
            <AvailabilityMessage labels={labels} state={emailState} />
          </label>
          <label className="grid gap-1 text-sm">
            {labels.password}
            <input className="rounded-md border border-slate-300 px-3 py-2" minLength={8} name="password" required type="password" />
          </label>
          <label className="grid gap-1 text-sm">
            {labels.nameEn}
            <input className="rounded-md border border-slate-300 px-3 py-2" name="nameEn" />
          </label>
          <label className="grid gap-1 text-sm">
            {labels.nameKr}
            <input className="rounded-md border border-slate-300 px-3 py-2" name="nameKr" />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            {labels.phone}
            <input className="rounded-md border border-slate-300 px-3 py-2" name="phone" />
          </label>
        </div>
      </section>

      <section>
        <div
          className="h-36 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600"
          onScroll={(event) => {
            const element = event.currentTarget;
            if (element.scrollTop + element.clientHeight >= element.scrollHeight - 4) {
              setTermsScrolled(true);
            }
          }}
        >
          {labels.terms}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            checked={termsAccepted}
            disabled={!termsScrolled}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            type="checkbox"
          />
          {labels.termsAgree}
        </label>
        {!termsScrolled ? <p className="mt-1 text-xs text-slate-500">{labels.termsRequired}</p> : null}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={!canSubmit}
          type="submit"
        >
          {isPending ? labels.submitting : labels.submit}
        </button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </form>
  );
}
