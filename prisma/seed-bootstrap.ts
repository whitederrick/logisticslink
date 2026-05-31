import { PrismaClient } from "@prisma/client";

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

async function main() {
  await seedPorts();
}

main().finally(async () => {
  await prisma.$disconnect();
});
