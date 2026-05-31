import { NextResponse } from "next/server";
import { joinPoolRequestSchema, parsePositiveRouteId, validatePoolJoinRequest } from "@/lib/api-contract";
import { getCurrentUser, operationalAccessError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateQuoteVolumes } from "@/lib/quote-volume";

export async function POST(request: Request, context: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await context.params;
  const numericPoolId = parsePositiveRouteId(poolId);

  if (!numericPoolId) {
    return NextResponse.json({ error: "INVALID_POOL_ID" }, { status: 400 });
  }

  const parsed = joinPoolRequestSchema.safeParse(await request.json());

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

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });
  }

  const accessError = operationalAccessError(user);
  if (accessError) {
    return NextResponse.json({ error: accessError }, { status: 403 });
  }

  const existingParticipant = await prisma.poolParticipant.findUnique({
    where: { poolId_userId: { poolId: pool.id, userId: quote.requesterId } }
  });

  const joinError = validatePoolJoinRequest({ existingParticipant, pool, quote, user });
  if (joinError) {
    const status = joinError === "QUOTE_ACCESS_DENIED" ? 403 : joinError === "QUOTE_DOES_NOT_MATCH_POOL" ? 422 : 409;
    return NextResponse.json({ error: joinError }, { status });
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
