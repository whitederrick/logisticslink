import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { businessTypes, countries } from "@/lib/master-data";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  businessNumber: z.string().trim().min(3).max(40),
  businessType: z.string().refine((value) => businessTypes.includes(value), {
    message: "Unsupported business type"
  }),
  companyNameEn: z.string().trim().min(2).max(120),
  companyNameKr: z.string().trim().max(120).optional(),
  companyRegion: z.string().refine((value) => countries.includes(value), {
    message: "Unsupported country"
  }),
  email: z.string().trim().email().max(160),
  nameEn: z.string().trim().max(80).optional(),
  nameKr: z.string().trim().max(80).optional(),
  password: z.string().min(8).max(80),
  phone: z.string().trim().max(40).optional(),
  role: z.enum([UserRole.SHIPPER, UserRole.FORWARDER, UserRole.CARRIER]),
  termsAccepted: z.literal(true),
  termsScrolled: z.literal(true)
});

function buildUsername(email: string) {
  const prefix = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 24);
  return `${prefix}_${Date.now().toString(36)}`;
}

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_SIGNUP_REQUEST", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const [emailOwner, businessNumberOwner] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.email } }),
    prisma.user.findFirst({ where: { businessNumber: input.businessNumber } })
  ]);

  if (emailOwner) {
    return NextResponse.json({ error: "EMAIL_ALREADY_EXISTS" }, { status: 409 });
  }

  if (businessNumberOwner) {
    return NextResponse.json({ error: "BUSINESS_NUMBER_ALREADY_EXISTS" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      businessNumber: input.businessNumber,
      businessType: input.businessType,
      companyNameEn: input.companyNameEn,
      companyNameKr: input.companyNameKr || null,
      companyRegion: input.companyRegion,
      email: input.email,
      logisticsModes: ["OCEAN"],
      nameEn: input.nameEn || null,
      nameKr: input.nameKr || null,
      passwordHash,
      phone: input.phone || null,
      role: input.role,
      status: "PENDING_APPROVAL",
      username: buildUsername(input.email)
    }
  });

  return NextResponse.json(
    {
      status: user.status,
      userId: user.id
    },
    { status: 201 }
  );
}
