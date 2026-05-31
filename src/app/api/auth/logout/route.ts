import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  await clearSessionCookie();
  const url = new URL(request.url);
  return NextResponse.redirect(new URL(`/login${url.search}`, url.origin));
}
