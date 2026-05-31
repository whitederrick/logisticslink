import { parseRateBenchmarkSourceConfig } from "@/lib/rate-benchmark-sync";

type EnvMap = Record<string, string | undefined>;

const placeholderFragments = ["replace-with", "example.com", "USER:PASSWORD", "HOST:5432"];
const requiredRateSourceLabels = ["SCFI", "CARRIER_FAK", "CARRIER_PUBLIC_TARIFF"];

function isBlank(value: string | undefined) {
  return !value || value.trim().length === 0;
}

function looksLikePlaceholder(value: string | undefined) {
  if (!value) return false;
  return placeholderFragments.some((fragment) => value.includes(fragment));
}

function hasLongSecret(value: string | undefined) {
  return !!value && value.length >= 32 && !looksLikePlaceholder(value);
}

function isHttpsUrl(value: string | undefined) {
  if (!value) return false;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function validateRateBenchmarkCsvSourceUrls(value: string | undefined) {
  const sources = parseRateBenchmarkSourceConfig(value ?? "");
  const issues: string[] = [];

  if (sources.length === 0) {
    issues.push("RATE_BENCHMARK_CSV_SOURCES must include at least one labeled HTTPS CSV source.");
    return issues;
  }

  for (const source of sources) {
    if (source.label.startsWith("source-")) {
      issues.push(`RATE_BENCHMARK_CSV_SOURCES entry ${source.url} must use an explicit label such as SCFI=...`);
    }

    try {
      const url = new URL(source.url);
      if (url.protocol !== "https:") {
        issues.push(`RATE_BENCHMARK_CSV_SOURCES ${source.label} must use https.`);
      }
    } catch {
      issues.push(`RATE_BENCHMARK_CSV_SOURCES ${source.label} is not a valid URL.`);
    }
  }

  const labels = new Set(sources.map((source) => source.label));
  for (const requiredLabel of requiredRateSourceLabels) {
    if (!labels.has(requiredLabel)) {
      issues.push(`RATE_BENCHMARK_CSV_SOURCES must include ${requiredLabel}=https://...`);
    }
  }

  return issues;
}

export function validateProductionEnv(env: EnvMap) {
  const issues: string[] = [];

  if (isBlank(env.DATABASE_URL) || looksLikePlaceholder(env.DATABASE_URL)) {
    issues.push("DATABASE_URL must point to the production PostgreSQL database.");
  }

  if (!hasLongSecret(env.AUTH_SECRET ?? env.NEXTAUTH_SECRET)) {
    issues.push("AUTH_SECRET or NEXTAUTH_SECRET must be set to a non-placeholder value of at least 32 characters.");
  }

  if (!isHttpsUrl(env.NEXTAUTH_URL)) {
    issues.push("NEXTAUTH_URL must be the production HTTPS origin.");
  }

  if (env.AUTH_COOKIE_SECURE !== "true") {
    issues.push("AUTH_COOKIE_SECURE must be true in production.");
  }

  if (!hasLongSecret(env.CRON_SECRET)) {
    issues.push("CRON_SECRET must be set to a non-placeholder value of at least 32 characters.");
  }

  if (env.ALLOW_CRON_SECRET_QUERY !== "false") {
    issues.push("ALLOW_CRON_SECRET_QUERY must be false in production.");
  }

  if (env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== "false") {
    issues.push("NEXT_PUBLIC_ENABLE_DEMO_LOGIN must be false in production.");
  }

  issues.push(...validateRateBenchmarkCsvSourceUrls(env.RATE_BENCHMARK_CSV_SOURCES));

  return issues;
}
