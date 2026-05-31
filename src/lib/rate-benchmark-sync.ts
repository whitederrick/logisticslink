import { parseRateBenchmarkCsv } from "@/lib/rate-benchmark-input";
import { upsertRateBenchmarks } from "@/lib/rate-benchmark-store";

export type RateBenchmarkCsvSource = {
  label: string;
  url: string;
};

export type RateBenchmarkSyncResult = {
  errors: Array<{ error: string; label: string }>;
  imported: number;
  sources: number;
};

export function parseRateBenchmarkSourceConfig(value = process.env.RATE_BENCHMARK_CSV_SOURCES ?? ""): RateBenchmarkCsvSource[] {
  return value
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, index) => {
      const separatorIndex = entry.indexOf("=");
      if (separatorIndex === -1) {
        return { label: `source-${index + 1}`, url: entry };
      }

      return {
        label: entry.slice(0, separatorIndex).trim() || `source-${index + 1}`,
        url: entry.slice(separatorIndex + 1).trim()
      };
    })
    .filter((source) => source.url.length > 0);
}

export async function runRateBenchmarkCsvSync(sources = parseRateBenchmarkSourceConfig()): Promise<RateBenchmarkSyncResult> {
  const result: RateBenchmarkSyncResult = {
    errors: [],
    imported: 0,
    sources: sources.length
  };

  for (const source of sources) {
    try {
      const response = await fetch(source.url, { cache: "no-store" });
      if (!response.ok) {
        result.errors.push({ error: `HTTP_${response.status}`, label: source.label });
        continue;
      }

      const parsed = parseRateBenchmarkCsv(await response.text());
      if (!parsed.ok) {
        result.errors.push({ error: parsed.errors.join(" / "), label: source.label });
        continue;
      }

      await upsertRateBenchmarks(parsed.rows);
      result.imported += parsed.rows.length;
    } catch (error) {
      result.errors.push({ error: error instanceof Error ? error.message : "SYNC_FAILED", label: source.label });
    }
  }

  return result;
}
