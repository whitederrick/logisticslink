import assert from "node:assert/strict";
import test from "node:test";
import { bidRequestSchema, joinPoolRequestSchema, parsePositiveRouteId, shipmentStatusRequestSchema, userStatusRequestSchema, validatePoolJoinRequest } from "./api-contract";
import { canCreateOrJoinPoolWithQuote, canReadBid, canReadPool, canReadQuote } from "./access-policy";
import { operationalAccessError } from "./auth";
import { validateCarrierBid } from "./bid-validation";
import { shouldAllowCronSecretQueryParam } from "./cron-auth";
import { validateProductionEnv, validateRateBenchmarkCsvSourceUrls } from "./env-validation";
import { isPoolMatch } from "./matching";
import { calculateQuoteVolumes } from "./quote-volume";
import { parseRateBenchmarkCsv } from "./rate-benchmark-input";
import { rateBenchmarkSyncAction } from "./rate-benchmark-sync-audit";
import { parseRateBenchmarkSourceConfig } from "./rate-benchmark-sync";
import { getRateBenchmarks, resolveAuctionCeiling } from "./rate-benchmark";
import { resolveSignupInitialState } from "./signup-bootstrap";
import { nextShipmentStatus, shipmentProgress } from "./shipment-workflow";
import { calculateAuctionWindow } from "./time-lock";

test("calculateAuctionWindow opens D-14 and closes D-7 at the port local midnight", () => {
  const targetEtd = new Date("2026-06-15T12:00:00.000Z");
  const window = calculateAuctionWindow(targetEtd, "Asia/Seoul");

  assert.equal(window.auctionStartUtc.toISOString(), "2026-05-31T15:00:00.000Z");
  assert.equal(window.auctionEndUtc.toISOString(), "2026-06-07T15:00:00.000Z");
});

test("isPoolMatch accepts compatible pools within plus or minus three days", () => {
  const quote = {
    cargoType: "FCL_DRY",
    containerType: "40FT_DRY",
    isHazardous: false,
    isHeavy: false,
    isReefer: false,
    podCode: "USLGB",
    polCode: "KRPUS",
    serviceCode: "forwardlink-ocean",
    targetEtd: new Date("2026-06-15T00:00:00.000Z")
  };

  assert.equal(
    isPoolMatch(quote, {
      ...quote,
      id: 1,
      status: "AGGREGATING",
      targetEtd: new Date("2026-06-18T00:00:00.000Z")
    }),
    true
  );

  assert.equal(
    isPoolMatch(quote, {
      ...quote,
      id: 2,
      status: "AGGREGATING",
      targetEtd: new Date("2026-06-19T00:00:00.000Z")
    }),
    false
  );

  assert.equal(
    isPoolMatch(quote, {
      ...quote,
      id: 3,
      serviceCode: "air",
      status: "AGGREGATING"
    }),
    false
  );
});

test("calculateQuoteVolumes maps FCL containers to TEU and preserves LCL measurements", () => {
  assert.deepEqual(
    calculateQuoteVolumes({
      containerType: "40FT_DRY",
      mode: "OCEAN_FCL",
      quantity: 2,
      volumeCbm: null,
      weightTon: 18
    }),
    { volumeCbm: 0, volumeTeu: 4, weightTon: 18 }
  );

  assert.deepEqual(
    calculateQuoteVolumes({
      containerType: null,
      mode: "OCEAN_LCL",
      quantity: 12,
      volumeCbm: 9.5,
      weightTon: 3.2
    }),
    { volumeCbm: 9.5, volumeTeu: 0, weightTon: 3.2 }
  );
});

test("validateCarrierBid enforces auction window, SCFI ceiling, and current lowest bid", () => {
  const base = {
    auctionEndUtc: new Date("2026-06-08T00:00:00.000Z"),
    auctionStartUtc: new Date("2026-06-01T00:00:00.000Z"),
    carrierStatus: "ACTIVE",
    currentLowestRate: 2900,
    limitOverride: false,
    now: new Date("2026-06-03T00:00:00.000Z"),
    proposedRateUsd: 2800,
    scfiBaseRateUsd: 3200,
    status: "AUCTION"
  };

  assert.equal(validateCarrierBid(base), null);
  assert.equal(validateCarrierBid({ ...base, now: new Date("2026-05-31T23:59:00.000Z") }), "AUCTION_NOT_STARTED_D14_LOCK");
  assert.equal(validateCarrierBid({ ...base, proposedRateUsd: 3200 }), "BID_MUST_BE_BELOW_BASE_RATE");
  assert.equal(validateCarrierBid({ ...base, proposedRateUsd: 2950 }), "BID_MUST_BE_LOWER_THAN_CURRENT_LOWEST");
  assert.equal(validateCarrierBid({ ...base, carrierStatus: "LOCKED" }), "CARRIER_NOT_ALLOWED_TO_BID");
});

test("resolveAuctionCeiling compares multiple rate benchmarks and applies the lowest available ceiling", () => {
  const benchmarks = getRateBenchmarks({
    containerType: "40FT_DRY",
    podCode: "USLGB",
    polCode: "KRPUS"
  });
  const ceiling = resolveAuctionCeiling({
    containerType: "40FT_DRY",
    fallbackRateUsd: 3500,
    podCode: "USLGB",
    polCode: "KRPUS"
  });

  assert.equal(benchmarks.length, 4);
  assert.equal(ceiling.appliedRateUsd, 3180);
  assert.equal(ceiling.appliedSource, "SCFI");
});

test("parseRateBenchmarkCsv accepts quoted labels and normalizes route codes", () => {
  const parsed = parseRateBenchmarkCsv(`source,sourceLabel,polCode,podCode,containerGroup,rateUsd,validFrom
SCFI,"SCFI Korea, USWC",krpus,uslgb,DRY,3180.50,2026-05-28`);

  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(parsed.rows, [
    {
      benchmarkType: "MARKET_INDEX",
      confidenceScore: 70,
      containerGroup: "DRY",
      currency: "USD",
      externalRef: null,
      podCode: "USLGB",
      polCode: "KRPUS",
      provider: null,
      rateUsd: 3180.5,
      source: "SCFI",
      sourceLabel: "SCFI Korea, USWC",
      sourceTier: "PUBLIC",
      validFrom: "2026-05-28"
    }
  ]);
});

test("parseRateBenchmarkCsv preserves paid benchmark metadata for future comparison", () => {
  const parsed = parseRateBenchmarkCsv(`source,sourceTier,benchmarkType,sourceLabel,provider,externalRef,polCode,podCode,containerGroup,rateUsd,confidenceScore,validFrom
XENETA_CONTRACT,PAID,CONTRACT_RATE,"Xeneta contract benchmark",Xeneta,contract-krpus-uslgb,krpus,uslgb,DRY,3090,92,2026-05-28`);

  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.rows[0].source, "XENETA_CONTRACT");
  assert.equal(parsed.rows[0].sourceTier, "PAID");
  assert.equal(parsed.rows[0].benchmarkType, "CONTRACT_RATE");
  assert.equal(parsed.rows[0].provider, "Xeneta");
  assert.equal(parsed.rows[0].confidenceScore, 92);
});

test("parseRateBenchmarkSourceConfig maps labeled CSV source URLs", () => {
  assert.deepEqual(parseRateBenchmarkSourceConfig("SCFI=https://rates.example/scfi.csv;https://rates.example/fak.csv"), [
    { label: "SCFI", url: "https://rates.example/scfi.csv" },
    { label: "source-2", url: "https://rates.example/fak.csv" }
  ]);
});

test("rate benchmark sync audit action distinguishes failed source syncs", () => {
  assert.equal(rateBenchmarkSyncAction({ errors: [] }), "RATE_BENCHMARK_SYNC");
  assert.equal(rateBenchmarkSyncAction({ errors: [{ error: "HTTP_500", label: "SCFI" }] }), "RATE_BENCHMARK_SYNC_FAILED");
});

test("shipment workflow advances awarded pools through in-progress and completed states", () => {
  assert.equal(nextShipmentStatus("AWARDED"), "SHIPMENT_IN_PROGRESS");
  assert.equal(nextShipmentStatus("SHIPMENT_IN_PROGRESS"), "COMPLETED");
  assert.equal(nextShipmentStatus("COMPLETED"), null);
  assert.equal(shipmentProgress("AWARDED"), 33);
  assert.equal(shipmentProgress("COMPLETED"), 100);
});

test("API request contracts reject malformed ids and payloads", () => {
  assert.equal(parsePositiveRouteId("42"), 42);
  assert.equal(parsePositiveRouteId("0"), null);
  assert.equal(parsePositiveRouteId("abc"), null);

  assert.equal(bidRequestSchema.safeParse({ proposedRateUsd: 2800 }).success, true);
  assert.equal(bidRequestSchema.safeParse({ proposedRateUsd: -1 }).success, false);
  assert.equal(joinPoolRequestSchema.safeParse({ quoteId: 12 }).success, true);
  assert.equal(joinPoolRequestSchema.safeParse({ quoteId: 0 }).success, false);
  assert.equal(shipmentStatusRequestSchema.safeParse({ status: "SHIPMENT_IN_PROGRESS" }).success, true);
  assert.equal(shipmentStatusRequestSchema.safeParse({ status: "AUCTION" }).success, false);
  assert.equal(userStatusRequestSchema.safeParse({ status: "ACTIVE" }).success, true);
  assert.equal(userStatusRequestSchema.safeParse({ status: "DELETED" }).success, false);
});

test("operational access requires active users except admins", () => {
  assert.equal(operationalAccessError({ role: "SHIPPER", status: "ACTIVE" }), null);
  assert.equal(operationalAccessError({ role: "SHIPPER", status: "PENDING_APPROVAL" }), "USER_NOT_ACTIVE");
  assert.equal(operationalAccessError({ role: "CARRIER", status: "RESTRICTED" }), "USER_NOT_ACTIVE");
  assert.equal(operationalAccessError({ role: "ADMIN", status: "LOCKED" }), null);
});

test("cron query secrets are disabled by default in production", () => {
  assert.equal(shouldAllowCronSecretQueryParam({ nodeEnv: "production" }), false);
  assert.equal(shouldAllowCronSecretQueryParam({ allowQuery: "true", nodeEnv: "production" }), true);
  assert.equal(shouldAllowCronSecretQueryParam({ nodeEnv: "development" }), true);
});

test("production environment check rejects placeholders and unsafe cron settings", () => {
  const issues = validateProductionEnv({
    ALLOW_CRON_SECRET_QUERY: "true",
    AUTH_COOKIE_SECURE: "false",
    AUTH_SECRET: "replace-with-a-long-random-production-secret",
    CRON_SECRET: "short",
    DATABASE_URL: "postgresql://USER:PASSWORD@HOST:5432/forwardlink?schema=public",
    NEXT_PUBLIC_ENABLE_DEMO_LOGIN: "true",
    NEXTAUTH_URL: "http://forwardlink.example.com",
    RATE_BENCHMARK_CSV_SOURCES: "SCFI=http://rates.example/scfi.csv;https://rates.example/fak.csv"
  });

  assert.match(issues.join("\n"), /DATABASE_URL/);
  assert.match(issues.join("\n"), /AUTH_SECRET/);
  assert.match(issues.join("\n"), /NEXTAUTH_URL/);
  assert.match(issues.join("\n"), /AUTH_COOKIE_SECURE/);
  assert.match(issues.join("\n"), /CRON_SECRET/);
  assert.match(issues.join("\n"), /ALLOW_CRON_SECRET_QUERY/);
  assert.match(issues.join("\n"), /NEXT_PUBLIC_ENABLE_DEMO_LOGIN/);
  assert.match(issues.join("\n"), /must use https/);
  assert.match(issues.join("\n"), /explicit label/);
  assert.match(issues.join("\n"), /CARRIER_FAK/);
  assert.match(issues.join("\n"), /CARRIER_PUBLIC_TARIFF/);
});

test("production environment check accepts finalized HTTPS CSV sources", () => {
  assert.deepEqual(
    validateProductionEnv({
      ALLOW_CRON_SECRET_QUERY: "false",
      AUTH_COOKIE_SECURE: "true",
      AUTH_SECRET: "12345678901234567890123456789012",
      CRON_SECRET: "abcdefghijklmnopqrstuvwxyz123456",
      DATABASE_URL: "postgresql://forwardlink:secure@db.forwardlink.internal:5432/forwardlink?schema=public",
      NEXT_PUBLIC_ENABLE_DEMO_LOGIN: "false",
      NEXTAUTH_URL: "https://forwardlink.example.com",
      RATE_BENCHMARK_CSV_SOURCES: "SCFI=https://secure.example.com/scfi.csv;CARRIER_FAK=https://secure.example.com/carrier-fak.csv;CARRIER_PUBLIC_TARIFF=https://secure.example.com/public-tariff.csv"
    }),
    []
  );

  assert.deepEqual(
    validateRateBenchmarkCsvSourceUrls("SCFI=https://secure.example.com/scfi.csv;CARRIER_FAK=https://secure.example.com/carrier-fak.csv;CARRIER_PUBLIC_TARIFF=https://secure.example.com/public-tariff.csv"),
    []
  );
});

test("validatePoolJoinRequest mirrors pool join API conflict and mismatch rules", () => {
  const user = { id: 10, role: "SHIPPER" as const };
  const pool = {
    cargoType: "FCL_DRY",
    containerType: "40FT_DRY",
    isHazardous: false,
    isHeavy: false,
    isReefer: false,
    podCode: "USLGB",
    polCode: "KRPUS",
    serviceCode: "forwardlink-ocean",
    status: "AGGREGATING"
  };
  const quote = {
    ...pool,
    participants: [],
    requesterId: user.id
  };

  assert.equal(validatePoolJoinRequest({ existingParticipant: null, pool, quote, user }), null);
  assert.equal(validatePoolJoinRequest({ existingParticipant: null, pool: { ...pool, status: "AUCTION" }, quote, user }), "POOL_NOT_AGGREGATING");
  assert.equal(validatePoolJoinRequest({ existingParticipant: { id: 1 }, pool, quote, user }), "PARTICIPANT_ALREADY_IN_POOL");
  assert.equal(validatePoolJoinRequest({ existingParticipant: null, pool, quote: { ...quote, participants: [{ id: 1 }] }, user }), "QUOTE_ALREADY_IN_POOL");
  assert.equal(validatePoolJoinRequest({ existingParticipant: null, pool, quote: { ...quote, podCode: "USLAX" }, user }), "QUOTE_DOES_NOT_MATCH_POOL");
  assert.equal(validatePoolJoinRequest({ existingParticipant: null, pool, quote: { ...quote, serviceCode: "air" }, user }), "QUOTE_DOES_NOT_MATCH_POOL");
  assert.equal(validatePoolJoinRequest({ existingParticipant: null, pool, quote: { ...quote, requesterId: 99 }, user }), "QUOTE_ACCESS_DENIED");
});

test("role access policy isolates shipper, forwarder, carrier, and admin data", () => {
  const shipper = { id: 10, role: "SHIPPER" as const };
  const forwarder = { id: 20, role: "FORWARDER" as const };
  const carrier = { id: 30, role: "CARRIER" as const };
  const admin = { id: 40, role: "ADMIN" as const };
  const quote = { requesterId: shipper.id };
  const aggregatingPool = { createdById: forwarder.id, participants: [{ userId: shipper.id }], status: "AGGREGATING" };
  const auctionPool = { createdById: forwarder.id, participants: [], status: "AUCTION" };
  const awardedPool = { createdById: forwarder.id, participants: [], status: "AWARDED", winningCarrierId: carrier.id };
  const carrierBid = { carrierId: carrier.id };

  assert.equal(canReadQuote(shipper, quote), true);
  assert.equal(canReadQuote(forwarder, quote), false);
  assert.equal(canReadQuote(admin, quote), true);
  assert.equal(canCreateOrJoinPoolWithQuote(shipper, quote), true);
  assert.equal(canCreateOrJoinPoolWithQuote(carrier, quote), false);
  assert.equal(canReadPool(shipper, aggregatingPool), true);
  assert.equal(canReadPool(carrier, aggregatingPool), false);
  assert.equal(canReadPool(carrier, auctionPool), true);
  assert.equal(canReadPool(carrier, awardedPool), true);
  assert.equal(canReadBid(carrier, carrierBid), true);
  assert.equal(canReadBid(shipper, carrierBid), false);
  assert.equal(canReadBid(admin, carrierBid), true);
});

test("resolveSignupInitialState grants ADMIN/ACTIVE to the first signup when no admin exists", () => {
  const state = resolveSignupInitialState({ needsBootstrap: true }, "SHIPPER");

  assert.equal(state.bootstrapApplied, true);
  assert.equal(state.role, "ADMIN");
  assert.equal(state.status, "ACTIVE");
});

test("resolveSignupInitialState overrides role choice for bootstrap regardless of requested role", () => {
  for (const requested of ["SHIPPER", "FORWARDER", "CARRIER"] as const) {
    const state = resolveSignupInitialState({ needsBootstrap: true }, requested);
    assert.equal(state.bootstrapApplied, true);
    assert.equal(state.role, "ADMIN", `requested=${requested}`);
    assert.equal(state.status, "ACTIVE", `requested=${requested}`);
  }
});

test("resolveSignupInitialState preserves the requested role and PENDING_APPROVAL when an admin exists", () => {
  for (const requested of ["SHIPPER", "FORWARDER", "CARRIER"] as const) {
    const state = resolveSignupInitialState({ needsBootstrap: false }, requested);
    assert.equal(state.bootstrapApplied, false);
    assert.equal(state.role, requested, `requested=${requested}`);
    assert.equal(state.status, "PENDING_APPROVAL", `requested=${requested}`);
  }
});
