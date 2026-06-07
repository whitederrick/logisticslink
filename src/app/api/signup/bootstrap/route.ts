import { NextResponse } from "next/server";
import { getSignupBootstrapStatus } from "@/lib/signup-bootstrap";

export const dynamic = "force-dynamic";

/**
 * GET /api/signup/bootstrap
 *
 * 회원가입 폼이 마운트될 때 호출된다. ADMIN이 한 명도 없는 운영 DB라면
 * 폼 상단에 "첫 번째 운영자" 안내 배너를 띄우고, 가입 시 role/status를
 * 부트스트랩 규칙으로 덮어쓴다. ADMIN이 이미 존재하면 평범한 가입 플로우.
 */
export async function GET() {
  const status = await getSignupBootstrapStatus();
  return NextResponse.json(status);
}
