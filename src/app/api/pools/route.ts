import { NextResponse } from "next/server";
import { z } from "zod";
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
    include: { participants: true }
  });

  if (!quote) {
    return NextResponse.json({ error: "QUOTE_NOT_FOUND" }, { status: 404 });
  }

  if (quote.participants.length > 0) {
    return NextResponse.json({ error: "QUOTE_ALREADY_IN_POOL" }, { status: 409 });
  }

  const { auctionStartUtc, auctionEndUtc } = calculateAuctionWindow(quote.targetEtd);
  const volumes = calculateQuoteVolumes(quote);
  const scfiBaseRateUsd = parsed.data.scfiBaseRateUsd ?? Number(quote.guideRateUsd ?? 3200);

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
        scfiBaseRateUsd
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
