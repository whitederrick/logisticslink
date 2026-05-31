import { z } from "zod";

export const rateBenchmarkSchema = z.object({
  benchmarkType: z.enum(["MARKET_INDEX", "SPOT_RATE", "CONTRACT_RATE", "FAK", "PUBLIC_TARIFF", "INTERNAL_MASTER"]).default("MARKET_INDEX"),
  containerGroup: z.enum(["DRY", "REEFER", "LCL"]),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("USD"),
  confidenceScore: z.number().int().min(1).max(100).default(70),
  externalRef: z.string().trim().max(160).optional().nullable().transform((value) => value || null),
  podCode: z.string().trim().min(3).max(12).transform((value) => value.toUpperCase()),
  polCode: z.string().trim().min(3).max(12).transform((value) => value.toUpperCase()),
  provider: z.string().trim().max(80).optional().nullable().transform((value) => value || null),
  rateUsd: z.number().positive(),
  source: z.enum(["SCFI", "FBX", "DREWRY_WCI", "CARRIER_FAK", "CARRIER_PUBLIC_TARIFF", "XENETA_SPOT", "XENETA_CONTRACT", "COMMERCIAL_API", "INTERNAL_MASTER"]),
  sourceLabel: z.string().trim().min(2).max(120),
  sourceTier: z.enum(["PUBLIC", "PARTNER", "PAID", "INTERNAL", "LEGACY"]).default("PUBLIC"),
  validFrom: z.string().date()
});

export type RateBenchmarkInput = z.infer<typeof rateBenchmarkSchema>;
type RateBenchmarkField = keyof RateBenchmarkInput;

type CsvImportResult =
  | { ok: true; rows: RateBenchmarkInput[] }
  | { errors: string[]; ok: false };

const headerAliases = {
  container_group: "containerGroup",
  containergroup: "containerGroup",
  benchmark_type: "benchmarkType",
  benchmarktype: "benchmarkType",
  confidence: "confidenceScore",
  confidence_score: "confidenceScore",
  confidencescore: "confidenceScore",
  currency: "currency",
  external_ref: "externalRef",
  externalref: "externalRef",
  pod: "podCode",
  pod_code: "podCode",
  podcode: "podCode",
  pol: "polCode",
  pol_code: "polCode",
  polcode: "polCode",
  provider: "provider",
  rate: "rateUsd",
  rate_usd: "rateUsd",
  rateusd: "rateUsd",
  source: "source",
  source_label: "sourceLabel",
  sourcelabel: "sourceLabel",
  source_tier: "sourceTier",
  sourcetier: "sourceTier",
  valid_from: "validFrom",
  validfrom: "validFrom"
} as const;

function parseCsv(text: string) {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);

  if (inQuotes) {
    throw new Error("CSV_UNCLOSED_QUOTE");
  }

  return rows;
}

function normalizeHeader(header: string) {
  const key = header.trim().replaceAll(" ", "_").replaceAll("-", "_").toLowerCase();
  return headerAliases[key as keyof typeof headerAliases] ?? null;
}

export function parseRateBenchmarkCsv(csvText: string): CsvImportResult {
  let rows: string[][];

  try {
    rows = parseCsv(csvText.replace(/^\uFEFF/, ""));
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : "INVALID_CSV"], ok: false };
  }

  if (rows.length < 2) {
    return { errors: ["CSV_REQUIRES_HEADER_AND_ROWS"], ok: false };
  }

  const headers: Array<RateBenchmarkField | null> = rows[0].map(normalizeHeader);
  const requiredHeaders: RateBenchmarkField[] = ["source", "sourceLabel", "polCode", "podCode", "containerGroup", "rateUsd", "validFrom"];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    return { errors: [`CSV_MISSING_HEADERS:${missingHeaders.join(",")}`], ok: false };
  }

  const errors: string[] = [];
  const parsedRows: RateBenchmarkInput[] = [];

  rows.slice(1).forEach((row, index) => {
    const record = Object.fromEntries(
      headers.map((header, headerIndex) => [header, row[headerIndex] ?? ""]).filter(([header]) => header)
    ) as Record<string, string>;

    const parsed = rateBenchmarkSchema.safeParse({
      benchmarkType: record.benchmarkType || undefined,
      containerGroup: record.containerGroup,
      currency: record.currency || undefined,
      confidenceScore: record.confidenceScore ? Number(record.confidenceScore) : undefined,
      externalRef: record.externalRef || undefined,
      podCode: record.podCode,
      polCode: record.polCode,
      provider: record.provider || undefined,
      rateUsd: Number(record.rateUsd),
      source: record.source,
      sourceLabel: record.sourceLabel,
      sourceTier: record.sourceTier || undefined,
      validFrom: record.validFrom
    });

    if (parsed.success) {
      parsedRows.push(parsed.data);
    } else {
      errors.push(`ROW_${index + 2}:${Object.keys(parsed.error.flatten().fieldErrors).join(",")}`);
    }
  });

  if (errors.length > 0) {
    return { errors, ok: false };
  }

  return { ok: true, rows: parsedRows };
}
