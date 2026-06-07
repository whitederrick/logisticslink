"use client";

import { Language, withLanguage } from "@/lib/i18n";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const text = {
  en: {
    demo: "Demo accounts",
    email: "Email",
    failed: "Login failed",
    errors: {
      ACCOUNT_NOT_ALLOWED: "This account is locked or suspended. Contact the LogisticsLink administrator.",
      INVALID_EMAIL_OR_PASSWORD: "Email or password is incorrect.",
      INVALID_LOGIN_REQUEST: "Enter a valid email and password.",
      USER_NOT_ACTIVE: "This account is not active yet. Please wait for administrator approval."
    },
    login: "Login",
    loggingIn: "Logging in...",
    password: "Password",
    passwordHint: "All demo accounts use ForwardLink!123",
    rolePaths: {
      ADMIN: "/admin",
      CARRIER: "/carrier",
      FORWARDER: "/forwarder",
      SHIPPER: "/shipper"
    }
  },
  ko: {
    demo: "데모 계정",
    email: "이메일",
    failed: "로그인 실패",
    errors: {
      ACCOUNT_NOT_ALLOWED: "잠김 또는 정지된 계정입니다. LogisticsLink 관리자에게 문의해 주세요.",
      INVALID_EMAIL_OR_PASSWORD: "이메일 또는 비밀번호가 올바르지 않습니다.",
      INVALID_LOGIN_REQUEST: "올바른 이메일과 비밀번호를 입력해 주세요.",
      USER_NOT_ACTIVE: "아직 활성화되지 않은 계정입니다. 관리자 승인을 기다려 주세요."
    },
    login: "로그인",
    loggingIn: "로그인 중...",
    password: "비밀번호",
    passwordHint: "모든 데모 계정 비밀번호는 ForwardLink!123 입니다.",
    rolePaths: {
      ADMIN: "/admin",
      CARRIER: "/carrier",
      FORWARDER: "/forwarder",
      SHIPPER: "/shipper"
    }
  }
} as const;

const demoAccounts = [
  "shipper@forward-link.co.kr",
  "forwarder@forward-link.co.kr",
  "carrier@forward-link.co.kr",
  "admin@forward-link.co.kr"
];

function loginErrorMessage(error: string, labels: (typeof text)[Language]) {
  return labels.errors[error as keyof typeof labels.errors] ?? error;
}

export function LoginForm({ enableDemoLogin, language }: { enableDemoLogin: boolean; language: Language }) {
  const labels = text[language];
  const router = useRouter();
  const [email, setEmail] = useState(enableDemoLogin ? demoAccounts[0] : "");
  const [password, setPassword] = useState(enableDemoLogin ? "ForwardLink!123" : "");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(loginErrorMessage(result.error ?? labels.failed, labels));
      }

      const result = await response.json();
      const path = labels.rolePaths[result.role as keyof typeof labels.rolePaths];
      router.push(`${path}?lang=${language}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.failed);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className={`grid gap-6 ${enableDemoLogin ? "lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]" : "max-w-xl"}`}>
      <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={submit}>
        <label className="grid gap-1 text-sm">
          {labels.email}
          <input className="rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
        </label>
        <label className="grid gap-1 text-sm">
          {labels.password}
          <input className="rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
        </label>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white disabled:opacity-50" disabled={isPending} type="submit">
          <LogIn size={16} />
          {isPending ? labels.loggingIn : labels.login}
        </button>
        {message ? <p className="text-sm text-red-600">{message}</p> : null}
      </form>

      {enableDemoLogin ? (
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">{labels.demo}</h2>
          <p className="mt-1 text-sm text-slate-500">{labels.passwordHint}</p>
          <div className="mt-4 grid gap-2">
            {demoAccounts.map((account) => (
              <button
                className="rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:border-harbor hover:bg-teal-50"
                key={account}
                onClick={() => {
                  setEmail(account);
                  setPassword("ForwardLink!123");
                }}
                type="button"
              >
                {account}
              </button>
            ))}
          </div>
        </aside>
      ) : null}
    </section>
  );
}
