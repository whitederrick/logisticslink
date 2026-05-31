import { validateRateBenchmarkCsvSourceUrls } from "../src/lib/env-validation";
import { parseRateBenchmarkCsv } from "../src/lib/rate-benchmark-input";
import { parseRateBenchmarkSourceConfig } from "../src/lib/rate-benchmark-sync";

async function main() {
  const config = process.env.RATE_BENCHMARK_CSV_SOURCES ?? "";
  const configIssues = validateRateBenchmarkCsvSourceUrls(config);

  if (configIssues.length > 0) {
    console.error("Rate source configuration check failed:");
    for (const issue of configIssues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  const results = [];

  for (const source of parseRateBenchmarkSourceConfig(config)) {
    try {
      const response = await fetch(source.url, { cache: "no-store" });
      if (!response.ok) {
        results.push({ error: `HTTP_${response.status}`, label: source.label, status: "FAILED", url: source.url });
        continue;
      }

      const parsed = parseRateBenchmarkCsv(await response.text());
      if (!parsed.ok) {
        results.push({ error: parsed.errors.join(" / "), label: source.label, status: "FAILED", url: source.url });
        continue;
      }

      results.push({ importedRows: parsed.rows.length, label: source.label, status: "OK", url: source.url });
    } catch (error) {
      results.push({
        error: error instanceof Error ? error.message : "FETCH_FAILED",
        label: source.label,
        status: "FAILED",
        url: source.url
      });
    }
  }

  console.log(JSON.stringify(results, null, 2));

  if (results.some((result) => result.status === "FAILED")) {
    process.exit(1);
  }
}

main();
