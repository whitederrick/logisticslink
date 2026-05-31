import { statusLabel, statusTone } from "@/lib/format";
import { Language } from "@/lib/i18n";

export function StatusBadge({ language, value }: { language: Language; value: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(value)}`}>
      {statusLabel(value, language)}
    </span>
  );
}
