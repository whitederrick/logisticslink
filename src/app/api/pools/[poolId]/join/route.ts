import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateQuoteVolumes } from "@/lib/quote-volume";

const joinPoolSchema = z.object({
  quoteId: z.number().int().positive()
});

export async function POST(request: Request, context: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await context.params;
  const numericPoolId = Number(poolId);

  if (!Number.isInteger(numericPoolId) || numericPoolId <= 0) {
    return NextResponse.json({ error: "INVALID_POOL_ID" }, { status: 400 });
  }

  const parsed = joinPoolSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_JOIN_REQUEST", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [pool, quote] = await Promise.all([
    prisma.coBuyPool.findUnique({ where: { id: numericPoolId } }),
    prisma.quote.findUnique({ where: { id: parsed.data.quoteId }, include: { participants: true } })
  ]);

  if (!pool) {
    return NextResponse.json({ error: "POOL_NOT_FOUND" }, { status: 404 });
  }

  if (!quote) {
    return NextResponse.json({ error: "QUOTE_NOT_FOUND" }, { status: 404 });
  }

  if (pool.status !== "AGGREGATING") {
    return NextResponse.json({ error: "POOL_NOT_AGGREGATING" }, { status: 409 });
  }

  if (quote.participants.length > 0) {
    return NextResponse.json({ error: "QUOTE_ALREADY_IN_POOL" }, { status: 409 });
  }

  const existingParticipant = await prisma.poolParticipant.findUnique({
    where: { poolId_userId: { poolId: pool.id, userId: quote.requesterId } }
  });

  if (existingParticipant) {
    return NextResponse.json({ error: "PARTICIPANT_ALREADY_IN_POOL" }, { status: 409 });
  }

  const matches =
    pool.polCode === quote.polCode &&
    pool.podCode === quote.podCode &&
    pool.cargoType === quote.cargoType &&
    pool.containerType === quote.containerType &&
    pool.isHeavy === quote.isHeavy &&
    pool.isHazardous === quote.isHazardous &&
    pool.isReefer === quote.isReefer;

  if (!matches) {
    return NextResponse.json({ error: "QUOTE_DOES_NOT_MATCH_POOL" }, { status: 422 });
  }

  const volumes = calculateQuoteVolumes(quote);

  const result = await prisma.$transaction(async (tx) => {
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

    const updatedPool = await tx.coBuyPool.update({
      where: { id: pool.id },
      data: {
        totalVolumeTeu: { increment: volumes.volumeTeu },
        totalVolumeCbm: { increment: volumes.volumeCbm },
        totalWeightTon: { increment: volumes.weightTon }
      }
    });

    await tx.quote.update({
      where: { id: quote.id },
      data: { status: "MATCHED_TO_POOL" }
    });

    return { participant, updatedPool };
  });

  return NextResponse.json(
    {
      participantId: result.participant.id,
      poolId: result.updatedPool.id,
      status: result.participant.status,
      totalVolumeTeu: Number(result.updatedPool.totalVolumeTeu)
    },
    { status: 201 }
  );
}
