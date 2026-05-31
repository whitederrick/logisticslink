"use client";

import { Language } from "@/lib/i18n";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const text = {
  en: {
    file: "CSV file",
    hint: "Headers: source, sourceLabel, polCode, podCode, containerGroup, rateUsd, validFrom",
    import: "Import CSV",
    imported: "CSV imported.",
    importing: "Importing..."
  },
  ko: {
    file: "CSV 파일",
    hint: "헤더: source, sourceLabel, polCode, podCode, containerGroup, rateUsd, validFrom",
    import: "CSV 가져오기",
    imported: "CSV를 가져왔습니다.",
    importing: "가져오는 중..."
  }
} as const;

export function RateBenchmarkImportForm({ language }: { language: Language }) {
  const router = useRouter();
  const t = text[language];
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setIsPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/rate-benchmarks/import", {
        method: "POST",
        body: formData
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = Array.isArray(body.issues) ? ` ${body.issues.join(" / ")}` : "";
        throw new Error(`${body.error ?? `Request failed with ${response.status}`}${detail}`);
      }

      setMessage(`${t.imported} ${body.imported ?? 0} rows`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "IMPORT_FAILED");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form action={submit} className="mt-4 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto]">
      <label className="grid gap-1 text-sm">
        {t.file}
        <input accept=".csv,text/csv" className="block w-full text-sm" name="file" required type="file" />
        <span className="text-xs text-slate-500">{t.hint}</span>
      </label>
      <div className="flex flex-col justify-end gap-1">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 disabled:opacity-50"
          disabled={isPending}
          type="submit"
        >
          <Upload size={16} />
          {isPending ? t.importing : t.import}
        </button>
      </div>
      {message ? <p className="text-sm text-slate-500 sm:col-span-2">{message}</p> : null}
    </form>
  );
}
