import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_LOGIN_REQUEST" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "INVALID_EMAIL_OR_PASSWORD" }, { status: 401 });
  }

  if (user.status === "LOCKED" || user.status === "SUSPENDED") {
    return NextResponse.json({ error: "ACCOUNT_NOT_ALLOWED" }, { status: 403 });
  }

  await setSessionCookie(user.id);
  return NextResponse.json({
    role: user.role,
    status: user.status,
    userId: user.id
  });
}
