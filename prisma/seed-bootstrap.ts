import { UserRole, UserStatus, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedPorts() {
  await prisma.port.createMany({
    data: [
      { code: "AUSYD", name: "Sydney", countryCode: "AU", timezone: "Australia/Sydney" },
      { code: "BRSSZ", name: "Santos", countryCode: "BR", timezone: "America/Sao_Paulo" },
      { code: "CAVAN", name: "Vancouver", countryCode: "CA", timezone: "America/Vancouver" },
      { code: "CNSHA", name: "Shanghai", countryCode: "CN", timezone: "Asia/Shanghai" },
      { code: "CNNGB", name: "Ningbo-Zhoushan", countryCode: "CN", timezone: "Asia/Shanghai" },
      { code: "DEHAM", name: "Hamburg", countryCode: "DE", timezone: "Europe/Berlin" },
      { code: "EGALY", name: "Alexandria", countryCode: "EG", timezone: "Africa/Cairo" },
      { code: "INNSA", name: "Nhava Sheva", countryCode: "IN", timezone: "Asia/Kolkata" },
      { code: "JPTYO", name: "Tokyo", countryCode: "JP", timezone: "Asia/Tokyo" },
      { code: "KRPUS", name: "Busan", countryCode: "KR", timezone: "Asia/Seoul" },
      { code: "KRINC", name: "Incheon", countryCode: "KR", timezone: "Asia/Seoul" },
      { code: "MXZLO", name: "Manzanillo", countryCode: "MX", timezone: "America/Mexico_City" },
      { code: "NLRTM", name: "Rotterdam", countryCode: "NL", timezone: "Europe/Amsterdam" },
      { code: "PAMIT", name: "Manzanillo, Panama", countryCode: "PA", timezone: "America/Panama" },
      { code: "PHMNL", name: "Manila", countryCode: "PH", timezone: "Asia/Manila" },
      { code: "PLGDN", name: "Gdansk", countryCode: "PL", timezone: "Europe/Warsaw" },
      { code: "SGSIN", name: "Singapore", countryCode: "SG", timezone: "Asia/Singapore" },
      { code: "THLCH", name: "Laem Chabang", countryCode: "TH", timezone: "Asia/Bangkok" },
      { code: "TRMER", name: "Mersin", countryCode: "TR", timezone: "Europe/Istanbul" },
      { code: "USLAX", name: "Los Angeles", countryCode: "US", timezone: "America/Los_Angeles" },
      { code: "USLGB", name: "Long Beach", countryCode: "US", timezone: "America/Los_Angeles" },
      { code: "USNYC", name: "New York/New Jersey", countryCode: "US", timezone: "America/New_York" },
      { code: "VNHPH", name: "Hai Phong", countryCode: "VN", timezone: "Asia/Ho_Chi_Minh" },
      { code: "VNSGN", name: "Ho Chi Minh City", countryCode: "VN", timezone: "Asia/Ho_Chi_Minh" }
    ],
    skipDuplicates: true
  });
}

/**
 * 운영 배포에서 첫 어드민을 시드하고 싶을 때 사용하는 선택적 부트스트랩.
 * 환경변수가 모두 설정된 경우에만 동작하며, 이미 ADMIN이 존재하면 아무 일도 하지 않는다.
 *
 *   BOOTSTRAP_ADMIN_EMAIL=admin@example.com
 *   BOOTSTRAP_ADMIN_PASSWORD=<8+ chars>
 *   BOOTSTRAP_ADMIN_NAME_EN="LogisticsLink Admin"   (optional)
 *   BOOTSTRAP_ADMIN_NAME_KR="운영 관리자"             (optional)
 *
 * 평소에는 환경변수 없이 실행하면 포트 마스터만 적재된다.
 */
async function seedBootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("[seed-bootstrap] BOOTSTRAP_ADMIN_* env vars not set. Skipping admin seed.");
    return;
  }

  const existingAdmin = await prisma.user.count({ where: { role: UserRole.ADMIN } });
  if (existingAdmin > 0) {
    console.log("[seed-bootstrap] Admin already exists. Skipping admin seed.");
    return;
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    console.warn(`[seed-bootstrap] Email ${email} is already registered. Skipping admin seed.`);
    return;
  }

  const companyNameEn = process.env.BOOTSTRAP_ADMIN_NAME_EN ?? "LogisticsLink Admin";
  const companyNameKr = process.env.BOOTSTRAP_ADMIN_NAME_KR ?? "LogisticsLink 관리자";
  const usernamePrefix = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 24);

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      businessNumber: process.env.BOOTSTRAP_ADMIN_BUSINESS_NUMBER ?? `${usernamePrefix}-bootstrap`,
      businessType: "물류",
      companyNameEn,
      companyNameKr,
      companyRegion: "KOREA, REPUBLIC OF",
      email,
      logisticsModes: ["OCEAN"],
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      username: `${usernamePrefix}_${Date.now().toString(36)}`
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "BOOTSTRAP_ADMIN_SEED",
      actorId: admin.id,
      entityId: admin.id,
      entityType: "User",
      afterJson: { email: admin.email, role: admin.role, status: admin.status }
    }
  });

  console.log(`[seed-bootstrap] Seeded bootstrap admin ${admin.email} (id=${admin.id}).`);
}

async function main() {
  await seedPorts();
  await seedBootstrapAdmin();
}

main()
  .catch((error) => {
    console.error("[seed-bootstrap] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
