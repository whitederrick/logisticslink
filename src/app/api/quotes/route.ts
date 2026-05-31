import { FreightMode } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, operationalAccessError } from "@/lib/auth";
import { isHeavyCargo } from "@/lib/freight";
import { prisma } from "@/lib/prisma";

const createQuoteSchema = z.object({
  requesterId: z.number().int().positive().optional(),
  mode: z.nativeEnum(FreightMode),
  polCode: z.string().min(3),
  podCode: z.string().min(3),
  targetEtd: z.coerce.date(),
  cargoType: z.string().min(1),
  containerType: z.string().min(1).nullable().optional(),
  quantity: z.number().int().positive().optional(),
  weightTon: z.number().positive().optional(),
  volumeCbm: z.number().positive().optional(),
  packageType: z.string().min(1).optional(),
  unitSystem: z.string().min(1).optional(),
  isHazardous: z.boolean().default(false),
  isReefer: z.boolean().default(false),
  cargoDescription: z.string().optional()
});

function calculateGuideRateUsd(input: z.infer<typeof createQuoteSchema>) {
  const baseFclRate = input.isReefer ? 4100 : 3200;
  const quantity = input.quantity ?? 1;

  if (input.mode === FreightMode.OCEAN_FCL) {
    return baseFclRate * quantity;
  }

  const volume = input.volumeCbm ?? 1;
  const weight = input.weightTon ?? 1;
  return Math.max(volume * 85, weight * 120);
}

export async function POST(request: Request) {
  const parsed = createQuoteSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_QUOTE_REQUEST", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const requester = await getCurrentUser();

  if (!requester) {
    return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });
  }

  const accessError = operationalAccessError(requester);
  if (accessError) {
    return NextResponse.json({ error: accessError }, { status: 403 });
  }

  if (requester.role !== "SHIPPER" && requester.role !== "FORWARDER") {
    return NextResponse.json({ error: "QUOTE_REQUESTER_ROLE_NOT_ALLOWED" }, { status: 403 });
  }

  const isHeavy = isHeavyCargo(input.containerType, input.weightTon);
  const guideRateUsd = calculateGuideRateUsd(input);

  try {
    const quote = await prisma.quote.create({
      data: {
        requesterId: requester.id,
        requesterRole: requester.role,
        mode: input.mode,
        polCode: input.polCode,
        podCode: input.podCode,
        targetEtd: input.targetEtd,
        cargoType: input.cargoType,
        containerType: input.containerType,
        quantity: input.quantity,
        weightTon: input.weightTon,
        volumeCbm: input.volumeCbm,
        packageType: input.packageType,
        unitSystem: input.unitSystem,
        isHeavy,
        isHazardous: input.isHazardous,
        isReefer: input.isReefer,
        cargoDescription: input.cargoDescription,
        guideRateUsd
      }
    });

    return NextResponse.json(
      {
        quoteId: quote.id,
        isHeavy: quote.isHeavy,
        guideRateUsd: Number(quote.guideRateUsd)
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "QUOTE_CREATE_FAILED" }, { status: 422 });
  }
}
