import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.port.createMany({
    data: [
      { code: "KRPUS", name: "Busan", countryCode: "KR", timezone: "Asia/Seoul" },
      { code: "KRINC", name: "Incheon", countryCode: "KR", timezone: "Asia/Seoul" },
      { code: "CNSHA", name: "Shanghai", countryCode: "CN", timezone: "Asia/Shanghai" },
      { code: "USLAX", name: "Los Angeles", countryCode: "US", timezone: "America/Los_Angeles" },
      { code: "USLGB", name: "Long Beach", countryCode: "US", timezone: "America/Los_Angeles" },
      { code: "VNSGN", name: "Ho Chi Minh City", countryCode: "VN", timezone: "Asia/Ho_Chi_Minh" }
    ],
    skipDuplicates: true
  });

  const passwordHash = await bcrypt.hash("ForwardLink!123", 10);
  const users = [
    ["admin@forward-link.co.kr", "admin", UserRole.ADMIN, "ForwardLink Admin"],
    ["shipper@forward-link.co.kr", "shipper", UserRole.SHIPPER, "Demo Shipper"],
    ["forwarder@forward-link.co.kr", "forwarder", UserRole.FORWARDER, "Demo Forwarder"],
    ["carrier@forward-link.co.kr", "carrier", UserRole.CARRIER, "Demo Carrier"]
  ] as const;

  for (const [email, username, role, companyNameEn] of users) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        username,
        passwordHash,
        role,
        companyNameEn,
        companyRegion: "KOREA, REPUBLIC OF",
        businessNumber: `${username}-demo`,
        logisticsModes: ["OCEAN"]
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
