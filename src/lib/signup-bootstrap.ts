import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SignupBootstrapStatus = {
  adminCount: number;
  needsBootstrap: boolean;
};

export type SignupRequestedRole = "SHIPPER" | "FORWARDER" | "CARRIER";

export type SignupInitialState = {
  bootstrapApplied: boolean;
  role: UserRole;
  status: UserStatus;
};

const ADMIN: UserRole = "ADMIN";
const ACTIVE: UserStatus = "ACTIVE";
const PENDING_APPROVAL: UserStatus = "PENDING_APPROVAL";

/**
 * 운영 DB에 ADMIN이 한 명도 없을 때를 "부트스트랩 필요" 상태로 본다.
 * 카운트는 비교적 가벼운 쿼리이므로 마운트 시 GET으로도 안전하게 호출할 수 있다.
 */
export async function getSignupBootstrapStatus(): Promise<SignupBootstrapStatus> {
  const adminCount = await prisma.user.count({ where: { role: ADMIN } });
  return { adminCount, needsBootstrap: adminCount === 0 };
}

/**
 * 부트스트랩이 필요하면 사용자가 어떤 역할을 골랐든 강제로 ADMIN/ACTIVE를 부여한다.
 * 그 외에는 입력받은 역할과 PENDING_APPROVAL을 그대로 유지한다.
 * 순수 함수라 단위 테스트가 쉽다.
 */
export function resolveSignupInitialState(
  bootstrap: { needsBootstrap: boolean },
  requestedRole: SignupRequestedRole
): SignupInitialState {
  if (bootstrap.needsBootstrap) {
    return {
      bootstrapApplied: true,
      role: ADMIN,
      status: ACTIVE
    };
  }
  return {
    bootstrapApplied: false,
    role: requestedRole,
    status: PENDING_APPROVAL
  };
}
