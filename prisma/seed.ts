import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { resolveAuctionCeilingFromBenchmarks } from "../src/lib/rate-benchmark";
import { calculateQuoteVolumes } from "../src/lib/quote-volume";
import { calculateAuctionWindow } from "../src/lib/time-lock";

const prisma = new PrismaClient();

type SeedRateBenchmarkSource = "SCFI" | "FBX" | "DREWRY_WCI" | "CARRIER_FAK" | "CARRIER_PUBLIC_TARIFF" | "XENETA_SPOT" | "XENETA_CONTRACT" | "COMMERCIAL_API" | "INTERNAL_MASTER";
type SeedRateBenchmarkTier = "PUBLIC" | "PARTNER" | "PAID" | "INTERNAL" | "LEGACY";
type SeedRateBenchmarkType = "MARKET_INDEX" | "SPOT_RATE" | "CONTRACT_RATE" | "FAK" | "PUBLIC_TARIFF" | "INTERNAL_MASTER";

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

type SeedRateBenchmark = {
  benchmarkType: SeedRateBenchmarkType;
  confidenceScore: number;
  containerGroup: "DRY" | "REEFER";
  podCode: string;
  polCode: string;
  provider: string;
  rateUsd: number;
  source: SeedRateBenchmarkSource;
  sourceLabel: string;
  sourceTier: SeedRateBenchmarkTier;
  validFrom: Date;
};

const freightRateBenchmarks: SeedRateBenchmark[] = [
  {
    containerGroup: "DRY",
    benchmarkType: "MARKET_INDEX",
    confidenceScore: 70,
    podCode: "USLGB",
    polCode: "KRPUS",
    provider: "Shanghai Shipping Exchange",
    rateUsd: 3180,
    source: "SCFI",
    sourceLabel: "SCFI Korea-USWC proxy",
    sourceTier: "PUBLIC",
    validFrom: new Date("2026-05-20T00:00:00.000Z")
  },
  {
    benchmarkType: "FAK",
    confidenceScore: 80,
    containerGroup: "DRY",
    podCode: "USLGB",
    polCode: "KRPUS",
    provider: "Carrier rate sheet",
    rateUsd: 3270,
    source: "CARRIER_FAK",
    sourceLabel: "Carrier FAK filed rate",
    sourceTier: "PARTNER",
    validFrom: new Date("2026-05-21T00:00:00.000Z")
  },
  {
    benchmarkType: "PUBLIC_TARIFF",
    confidenceScore: 65,
    containerGroup: "DRY",
    podCode: "USLGB",
    polCode: "KRPUS",
    provider: "Carrier public tariff",
    rateUsd: 3340,
    source: "CARRIER_PUBLIC_TARIFF",
    sourceLabel: "Carrier public web tariff",
    sourceTier: "PARTNER",
    validFrom: new Date("2026-05-18T00:00:00.000Z")
  },
  {
    benchmarkType: "INTERNAL_MASTER",
    confidenceScore: 85,
    containerGroup: "DRY",
    podCode: "USLGB",
    polCode: "KRPUS",
    provider: "LogisticsLink Ocean",
    rateUsd: 3210,
    source: "INTERNAL_MASTER",
    sourceLabel: "LogisticsLink Ocean internal rate master",
    sourceTier: "INTERNAL",
    validFrom: new Date("2026-05-22T00:00:00.000Z")
  },
  {
    benchmarkType: "MARKET_INDEX",
    confidenceScore: 70,
    containerGroup: "REEFER",
    podCode: "USLAX",
    polCode: "KRPUS",
    provider: "Shanghai Shipping Exchange",
    rateUsd: 4050,
    source: "SCFI",
    sourceLabel: "SCFI Korea-USWC reefer proxy",
    sourceTier: "PUBLIC",
    validFrom: new Date("2026-05-20T00:00:00.000Z")
  },
  {
    benchmarkType: "FAK",
    confidenceScore: 80,
    containerGroup: "REEFER",
    podCode: "USLAX",
    polCode: "KRPUS",
    provider: "Carrier rate sheet",
    rateUsd: 4180,
    source: "CARRIER_FAK",
    sourceLabel: "Carrier FAK reefer filed rate",
    sourceTier: "PARTNER",
    validFrom: new Date("2026-05-21T00:00:00.000Z")
  },
  {
    benchmarkType: "PUBLIC_TARIFF",
    confidenceScore: 65,
    containerGroup: "REEFER",
    podCode: "USLAX",
    polCode: "KRPUS",
    provider: "Carrier public tariff",
    rateUsd: 4230,
    source: "CARRIER_PUBLIC_TARIFF",
    sourceLabel: "Carrier public reefer tariff",
    sourceTier: "PARTNER",
    validFrom: new Date("2026-05-18T00:00:00.000Z")
  },
  {
    benchmarkType: "INTERNAL_MASTER",
    confidenceScore: 85,
    containerGroup: "REEFER",
    podCode: "USLAX",
    polCode: "KRPUS",
    provider: "LogisticsLink Ocean",
    rateUsd: 4110,
    source: "INTERNAL_MASTER",
    sourceLabel: "LogisticsLink Ocean internal reefer master",
    sourceTier: "INTERNAL",
    validFrom: new Date("2026-05-22T00:00:00.000Z")
  }
];

async function seedPorts() {
  await prisma.port.createMany({
    data: [
      { code: "AUSYD", name: "Sydney", countryCode: "AU", timezone: "Australia/Sydney" },
      { code: "BRSSZ", name: "Santos", countryCode: "BR", timezone: "America/Sao_Paulo" },
      { code: "CAVAN", name: "Vancouver", countryCode: "CA", timezone: "America/Vancouver" },
      { code: "CNSHA", name: "Shanghai", countryCode: "CN", timezone: "Asia/Shanghai" },
      { code: "CNNGB", name: "Ningbo-Zhoushan", countryCode: "CN", timezone: "Asia/Shanghai" },
      { code: "DEHAM", name: "Hamburg", countryCode: "DE", timezone: "Europe/Berlin" },
      { code: "EGALY", name: "Alexandria", countryCode: "EG", timezone: "Africa/Cairo" },
      { code: "INNSA", name: "Nhava Sheva", countryCode: "IN", timezone: "Asia/Kolkata" },
      { code: "JPTYO", name: "Tokyo", countryCode: "JP", timezone: "Asia/Tokyo" },
      { code: "KRPUS", name: "Busan", countryCode: "KR", timezone: "Asia/Seoul" },
      { code: "KRINC", name: "Incheon", countryCode: "KR", timezone: "Asia/Seoul" },
      { code: "MXZLO", name: "Manzanillo", countryCode: "MX", timezone: "America/Mexico_City" },
      { code: "NLRTM", name: "Rotterdam", countryCode: "NL", timezone: "Europe/Amsterdam" },
      { code: "PAMIT", name: "Manzanillo, Panama", countryCode: "PA", timezone: "America/Panama" },
      { code: "PHMNL", name: "Manila", countryCode: "PH", timezone: "Asia/Manila" },
      { code: "PLGDN", name: "Gdansk", countryCode: "PL", timezone: "Europe/Warsaw" },
      { code: "SGSIN", name: "Singapore", countryCode: "SG", timezone: "Asia/Singapore" },
      { code: "THLCH", name: "Laem Chabang", countryCode: "TH", timezone: "Asia/Bangkok" },
      { code: "TRMER", name: "Mersin", countryCode: "TR", timezone: "Europe/Istanbul" },
      { code: "USLAX", name: "Los Angeles", countryCode: "US", timezone: "America/Los_Angeles" },
      { code: "USLGB", name: "Long Beach", countryCode: "US", timezone: "America/Los_Angeles" },
      { code: "USNYC", name: "New York/New Jersey", countryCode: "US", timezone: "America/New_York" },
      { code: "VNHPH", name: "Hai Phong", countryCode: "VN", timezone: "Asia/Ho_Chi_Minh" },
      { code: "VNSGN", name: "Ho Chi Minh City", countryCode: "VN", timezone: "Asia/Ho_Chi_Minh" }
    ],
    skipDuplicates: true
  });
}

async function seedRateBenchmarks() {
  for (const rate of freightRateBenchmarks) {
    await prisma.$executeRaw`
      INSERT INTO "FreightRateBenchmark" ("source", "sourceTier", "benchmarkType", "sourceLabel", "provider", "polCode", "podCode", "containerGroup", "rateUsd", "confidenceScore", "validFrom", "updatedAt")
      VALUES (${rate.source}::"RateBenchmarkSource", ${rate.sourceTier}::"RateBenchmarkTier", ${rate.benchmarkType}::"RateBenchmarkType", ${rate.sourceLabel}, ${rate.provider}, ${rate.polCode}, ${rate.podCode}, ${rate.containerGroup}, ${rate.rateUsd}, ${rate.confidenceScore}, ${rate.validFrom}, NOW())
      ON CONFLICT ("source", "polCode", "podCode", "containerGroup", "validFrom")
      DO UPDATE SET "sourceTier" = EXCLUDED."sourceTier", "benchmarkType" = EXCLUDED."benchmarkType", "sourceLabel" = EXCLUDED."sourceLabel", "provider" = EXCLUDED."provider", "rateUsd" = EXCLUDED."rateUsd", "confidenceScore" = EXCLUDED."confidenceScore", "updatedAt" = NOW()
    `;
  }
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash("LogisticsLink!123", 10);
  const users = [
    ["admin@logisticslink.co.kr", "admin", UserRole.ADMIN, "LogisticsLink Operations", "LogisticsLink 운영팀"],
    ["shipper@logisticslink.co.kr", "shipper", UserRole.SHIPPER, "Busan Export Manufacturing", "부산수출제조"],
    ["forwarder@logisticslink.co.kr", "forwarder", UserRole.FORWARDER, "Seoul Forwarding Partners", "서울포워딩파트너스"],
    ["carrier@logisticslink.co.kr", "carrier", UserRole.CARRIER, "Pacific Container Line", "퍼시픽컨테이너라인"]
  ] as const;

  for (const [email, username, role, companyNameEn, companyNameKr] of users) {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          businessNumber: `LL-SCENARIO-${username.toUpperCase()}`,
          businessType: role === UserRole.CARRIER ? "Ocean carrier" : "Export logistics",
          companyNameEn,
          companyNameKr,
          companyRegion: "KOREA, REPUBLIC OF",
          email,
          logisticsModes: ["OCEAN"],
          passwordHash,
          role,
          status: "ACTIVE",
          username
        }
      });
      continue;
    }

    await prisma.user.create({
      data: {
        businessNumber: `LL-SCENARIO-${username.toUpperCase()}`,
        businessType: role === UserRole.CARRIER ? "Ocean carrier" : "Export logistics",
        companyNameEn,
        companyNameKr,
        companyRegion: "KOREA, REPUBLIC OF",
        email,
        logisticsModes: ["OCEAN"],
        passwordHash,
        role,
        username
      }
    });
  }
}

async function ensureScenarioAuctionPool(poolId: number) {
  await prisma.coBuyPool.update({
    where: { id: poolId },
    data: {
      auctionEndUtc: addDays(new Date(), 6),
      auctionStartUtc: addDays(new Date(), -1),
      containerType: "40FT_DRY",
      isReefer: false,
      podCode: "USLGB",
      polCode: "KRPUS",
      scfiBaseRateUsd: 3180,
      status: "AUCTION_LIVE"
    }
  });
}

async function main() {
  await seedPorts();
  await seedRateBenchmarks();
  await seedUsers();

  const [shipper, forwarder, carrier] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { username: "shipper" } }),
    prisma.user.findUniqueOrThrow({ where: { username: "forwarder" } }),
    prisma.user.findUniqueOrThrow({ where: { username: "carrier" } })
  ]);

  const existingPool = await prisma.coBuyPool.findFirst({
    where: {
      createdById: { in: [shipper.id, forwarder.id] },
      cargoType: { in: ["FCL_DRY", "FCL_REEFER"] }
    }
  });

  if (existingPool) {
    const activeAuction = await prisma.coBuyPool.findFirst({ where: { status: "AUCTION_LIVE" } });
    await ensureScenarioAuctionPool((activeAuction ?? existingPool).id);
    return;
  }

  const now = new Date();
  const aggregatingEtd = addDays(now, 21);
  const auctionEtd = addDays(now, 10);

  const forwarderQuote = await prisma.quote.create({
    data: {
      cargoType: "FCL_DRY",
      containerType: "40FT_DRY",
      guideRateUsd: 3200,
      mode: "OCEAN_FCL",
      podCode: "USLGB",
      polCode: "KRPUS",
      quantity: 2,
      requesterId: forwarder.id,
      requesterRole: forwarder.role,
      targetEtd: aggregatingEtd,
      unitSystem: "METRIC",
      weightTon: 18
    }
  });

  const matchingShipperQuote = await prisma.quote.create({
    data: {
      cargoType: "FCL_DRY",
      containerType: "40FT_DRY",
      guideRateUsd: 3200,
      mode: "OCEAN_FCL",
      podCode: "USLGB",
      polCode: "KRPUS",
      quantity: 1,
      requesterId: shipper.id,
      requesterRole: shipper.role,
      targetEtd: addDays(aggregatingEtd, 2),
      unitSystem: "METRIC",
      weightTon: 10
    }
  });

  const auctionQuote = await prisma.quote.create({
    data: {
      cargoType: "FCL_REEFER",
      containerType: "40FT_REEFER",
      guideRateUsd: 4100,
      isReefer: true,
      mode: "OCEAN_FCL",
      podCode: "USLAX",
      polCode: "KRPUS",
      quantity: 3,
      requesterId: shipper.id,
      requesterRole: shipper.role,
      targetEtd: auctionEtd,
      unitSystem: "METRIC",
      weightTon: 21
    }
  });

  const aggregatingVolumes = calculateQuoteVolumes(forwarderQuote);
  const aggregatingWindow = calculateAuctionWindow(aggregatingEtd, "Asia/Seoul");
  const aggregatingCeiling = await resolveAuctionCeilingFromBenchmarks({
    containerType: forwarderQuote.containerType,
    fallbackRateUsd: 3200,
    isReefer: forwarderQuote.isReefer,
    podCode: forwarderQuote.podCode,
    polCode: forwarderQuote.polCode
  });
  const aggregatingPool = await prisma.coBuyPool.create({
    data: {
      auctionEndUtc: aggregatingWindow.auctionEndUtc,
      auctionStartUtc: aggregatingWindow.auctionStartUtc,
      cargoType: forwarderQuote.cargoType,
      containerType: forwarderQuote.containerType,
      createdById: forwarder.id,
      podCode: forwarderQuote.podCode,
      polCode: forwarderQuote.polCode,
      scfiBaseRateUsd: aggregatingCeiling.appliedRateUsd,
      targetEtd: forwarderQuote.targetEtd,
      totalVolumeCbm: aggregatingVolumes.volumeCbm,
      totalVolumeTeu: aggregatingVolumes.volumeTeu,
      totalWeightTon: aggregatingVolumes.weightTon
    }
  });

  await prisma.poolParticipant.create({
    data: {
      poolId: aggregatingPool.id,
      quoteId: forwarderQuote.id,
      role: forwarder.role,
      userId: forwarder.id,
      volumeCbm: aggregatingVolumes.volumeCbm,
      volumeTeu: aggregatingVolumes.volumeTeu,
      weightTon: aggregatingVolumes.weightTon
    }
  });
  await prisma.quote.update({ where: { id: forwarderQuote.id }, data: { status: "MATCHED_TO_POOL" } });

  const auctionVolumes = calculateQuoteVolumes(auctionQuote);
  const auctionWindow = calculateAuctionWindow(auctionEtd, "Asia/Seoul");
  const auctionCeiling = await resolveAuctionCeilingFromBenchmarks({
    containerType: auctionQuote.containerType,
    fallbackRateUsd: 4100,
    isReefer: auctionQuote.isReefer,
    podCode: auctionQuote.podCode,
    polCode: auctionQuote.polCode
  });
  const auctionPool = await prisma.coBuyPool.create({
    data: {
      auctionEndUtc: auctionWindow.auctionEndUtc,
      auctionStartUtc: auctionWindow.auctionStartUtc,
      cargoType: auctionQuote.cargoType,
      containerType: auctionQuote.containerType,
      createdById: shipper.id,
      isReefer: true,
      podCode: auctionQuote.podCode,
      polCode: auctionQuote.polCode,
      scfiBaseRateUsd: auctionCeiling.appliedRateUsd,
      status: "AUCTION_LIVE",
      targetEtd: auctionQuote.targetEtd,
      totalVolumeCbm: auctionVolumes.volumeCbm,
      totalVolumeTeu: auctionVolumes.volumeTeu,
      totalWeightTon: auctionVolumes.weightTon
    }
  });

  await prisma.poolParticipant.create({
    data: {
      poolId: auctionPool.id,
      quoteId: auctionQuote.id,
      role: shipper.role,
      userId: shipper.id,
      volumeCbm: auctionVolumes.volumeCbm,
      volumeTeu: auctionVolumes.volumeTeu,
      weightTon: auctionVolumes.weightTon
    }
  });

  await prisma.auctionBid.create({
    data: {
      carrierId: carrier.id,
      isWinningAtTime: true,
      poolId: auctionPool.id,
      proposedRateUsd: 3920
    }
  });
  await prisma.quote.update({ where: { id: auctionQuote.id }, data: { status: "MATCHED_TO_POOL" } });

  await prisma.notification.createMany({
    data: [
      {
        message: "KRPUS → USLGB 구간에 ETD가 가까운 공동구매 풀이 있습니다.",
        relatedEntityId: matchingShipperQuote.id,
        relatedEntityType: "Quote",
        title: "추천 공동구매 풀",
        type: "POOL_RECOMMENDATION",
        userId: shipper.id
      },
      {
        message: "KRPUS → USLAX 냉장 화물 경매에서 현재 최저가를 유지 중입니다.",
        relatedEntityId: auctionPool.id,
        relatedEntityType: "CoBuyPool",
        title: "입찰 최저가 유지",
        type: "BID_LEADING",
        userId: carrier.id
      }
    ]
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
