import { UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAuditLog } from "@/lib/audit-log";
import { resolveSignupInitialState, SignupRequestedRole } from "@/lib/signup-bootstrap";
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

  // 부트스트랩 판정과 생성을 한 트랜잭션 안에서 묶어 동시 가입 레이스를 좁힌다.
  // 두 사용자가 거의 동시에 가입해도 adminCount를 본 시점의 스냅샷 기준으로
  // 한 명만 ADMIN이 된다 (PostgreSQL READ COMMITTED + row lock).
  const result = await prisma.$transaction(async (tx) => {
    const adminCount = await tx.user.count({ where: { role: UserRole.ADMIN } });
    const initialState = resolveSignupInitialState(
      { needsBootstrap: adminCount === 0 },
      input.role as SignupRequestedRole
    );

    const user = await tx.user.create({
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
        role: initialState.role,
        status: initialState.status,
        username: buildUsername(input.email)
      }
    });

    return { user, bootstrapApplied: initialState.bootstrapApplied, adminCount };
  });

  // 부트스트랩이 실제로 적용된 경우에만 감사 로그를 남긴다.
  if (result.bootstrapApplied) {
    await recordAuditLog({
      action: "FIRST_ADMIN_BOOTSTRAP",
      actorId: result.user.id,
      after: { email: result.user.email, role: result.user.role, status: result.user.status },
      entityId: result.user.id,
      entityType: "User"
    });
  }

  return NextResponse.json(
    {
      adminCount: result.adminCount,
      bootstrapApplied: result.bootstrapApplied,
      role: result.user.role,
      status: result.user.status,
      userId: result.user.id
    },
    { status: 201 }
  );
}
