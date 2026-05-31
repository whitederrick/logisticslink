import { User, UserRole } from "@prisma/client";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Language } from "@/lib/i18n";

const SESSION_COOKIE = "forwardlink_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  exp: number;
  userId: number;
};

function secret() {
  const configuredSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET_REQUIRED");
  }

  return "forwardlink-local-dev-secret";
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSessionToken(userId: number) {
  const payload = base64Url(JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000, userId } satisfies SessionPayload));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    if (!parsed.userId || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: number) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true"
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  return prisma.user.findUnique({ where: { id: session.userId } });
}

export function isOperationalUser(user: Pick<User, "role" | "status">) {
  return user.role === "ADMIN" || user.status === "ACTIVE";
}

export function operationalAccessError(user: Pick<User, "role" | "status">) {
  return isOperationalUser(user) ? null : "USER_NOT_ACTIVE";
}

export async function requireUserRole(roles: UserRole[], language: Language) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?lang=${language}`);
  }

  if (!roles.includes(user.role)) {
    redirect(`/dashboard?lang=${language}`);
  }

  return user;
}
