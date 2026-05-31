"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActionButtonProps = {
  body?: unknown;
  children: React.ReactNode;
  className?: string;
  doneLabel?: string;
  errorLabel?: string;
  method?: "PATCH" | "POST";
  pendingLabel?: string;
  url: string;
};

export function ActionButton({
  body,
  children,
  className,
  doneLabel = "완료",
  errorLabel = "처리 실패",
  method = "POST",
  pendingLabel = "처리 중...",
  url
}: ActionButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setIsPending(true);
    setMessage(null);

    try {
      const response = await fetch(url, {
        method,
        headers: body == null ? undefined : { "Content-Type": "application/json" },
        body: body == null ? undefined : JSON.stringify(body)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? `Request failed with ${response.status}`);
      }

      setMessage(doneLabel);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errorLabel);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        className={
          className ??
          "inline-flex h-9 items-center justify-center rounded-md bg-ink px-3 text-sm font-medium text-white disabled:opacity-50"
        }
        disabled={isPending}
        onClick={run}
        type="button"
      >
        {isPending ? pendingLabel : children}
      </button>
      {message ? <p className="text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}
