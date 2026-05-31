import { NextResponse } from "next/server";
import { z } from "zod";
import { canCreateOrJoinPoolWithQuote } from "@/lib/access-policy";
import { getCurrentUser, operationalAccessError } from "@/lib/auth";
import { resolveAuctionCeilingFromBenchmarks } from "@/lib/rate-benchmark";
import { calculateAuctionWindow } from "@/lib/time-lock";
import { prisma } from "@/lib/prisma";
import { calculateQuoteVolumes } from "@/lib/quote-volume";

const createPoolSchema = z.object({
  quoteId: z.number().int().positive(),
  scfiBaseRateUsd: z.number().positive().optional()
});

export async function POST(request: Request) {
  const parsed = createPoolSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_POOL_REQUEST", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const quote = await prisma.quote.findUnique({
    where: { id: parsed.data.quoteId },
    include: { participants: true, pol: true }
  });

  if (!quote) {
    return NextResponse.json({ error: "QUOTE_NOT_FOUND" }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });
  }

  const accessError = operationalAccessError(user);
  if (accessError) {
    return NextResponse.json({ error: accessError }, { status: 403 });
  }

  if (!canCreateOrJoinPoolWithQuote(user, quote)) {
    return NextResponse.json({ error: "QUOTE_ACCESS_DENIED" }, { status: 403 });
  }

  if (quote.participants.length > 0) {
    return NextResponse.json({ error: "QUOTE_ALREADY_IN_POOL" }, { status: 409 });
  }

  if (quote.requesterRole !== "SHIPPER" && quote.requesterRole !== "FORWARDER") {
    return NextResponse.json({ error: "POOL_CREATOR_ROLE_NOT_ALLOWED" }, { status: 403 });
  }

  const { auctionStartUtc, auctionEndUtc } = calculateAuctionWindow(quote.targetEtd, quote.pol.timezone);
  const volumes = calculateQuoteVolumes(quote);
  const ceiling = await resolveAuctionCeilingFromBenchmarks({
    containerType: quote.containerType,
    fallbackRateUsd: parsed.data.scfiBaseRateUsd ?? Number(quote.guideRateUsd ?? 3200),
    isReefer: quote.isReefer,
    podCode: quote.podCode,
    polCode: quote.polCode
  });

  const result = await prisma.$transaction(async (tx) => {
    const pool = await tx.coBuyPool.create({
      data: {
        createdById: quote.requesterId,
        polCode: quote.polCode,
        podCode: quote.podCode,
        targetEtd: quote.targetEtd,
        cargoType: quote.cargoType,
        containerType: quote.containerType,
        isHazardous: quote.isHazardous,
        isReefer: quote.isReefer,
        isHeavy: quote.isHeavy,
        totalVolumeTeu: volumes.volumeTeu,
        totalVolumeCbm: volumes.volumeCbm,
        totalWeightTon: volumes.weightTon,
        auctionStartUtc,
        auctionEndUtc,
        scfiBaseRateUsd: ceiling.appliedRateUsd
      }
    });

    const participant = await tx.poolParticipant.create({
      data: {
        poolId: pool.id,
        userId: quote.requesterId,
        quoteId: quote.id,
        role: quote.requesterRole,
        volumeTeu: volumes.volumeTeu,
        volumeCbm: volumes.volumeCbm,
        weightTon: volumes.weightTon
      }
    });

    await tx.quote.update({
      where: { id: quote.id },
      data: { status: "MATCHED_TO_POOL" }
    });

    return { pool, participant };
  });

  return NextResponse.json(
    {
      poolId: result.pool.id,
      participantId: result.participant.id,
      status: result.pool.status,
      auctionStartUtc: result.pool.auctionStartUtc.toISOString(),
      auctionEndUtc: result.pool.auctionEndUtc.toISOString()
    },
    { status: 201 }
  );
}
