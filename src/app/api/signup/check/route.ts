import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const signupCheckSchema = z.object({
  businessNumber: z.string().min(1).optional(),
  email: z.string().email().optional()
});

export async function POST(request: Request) {
  const parsed = signupCheckSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_SIGNUP_CHECK_REQUEST", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { businessNumber, email } = parsed.data;

  if (!businessNumber && !email) {
    return NextResponse.json({ error: "EMAIL_OR_BUSINESS_NUMBER_REQUIRED" }, { status: 400 });
  }

  const [emailOwner, businessNumberOwner] = await Promise.all([
    email ? prisma.user.findUnique({ where: { email } }) : null,
    businessNumber ? prisma.user.findFirst({ where: { businessNumber } }) : null
  ]);

  return NextResponse.json({
    businessNumberAvailable: businessNumber ? businessNumberOwner == null : null,
    emailAvailable: email ? emailOwner == null : null
  });
}
