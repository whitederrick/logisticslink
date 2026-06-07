#!/usr/bin/env node
/* eslint-disable */
// =====================================================================
// A3 schema.prisma 패치 적용 스크립트 v2 (prisma format 호환)
// 사용법: node prisma/migrations/20260607234000_a3_d4_phase0_entities/apply-schema-patch-v2.js
// 결과: prisma/schema.prisma에 Phase 0 신규 엔터티 추가 (format된 형식 대응)
// =====================================================================

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.resolve(__dirname, '../../../prisma/schema.prisma');
const BACKUP_PATH = SCHEMA_PATH + '.bak.a3v2';

console.log('[A3-Patch-v2] schema.prisma 패치를 시작합니다...');

if (!fs.existsSync(BACKUP_PATH)) {
  fs.copyFileSync(SCHEMA_PATH, BACKUP_PATH);
  console.log('[A3-Patch-v2] 백업 생성됨:', BACKUP_PATH);
}

let content = fs.readFileSync(SCHEMA_PATH, 'utf8');

// =====================================================================
// 1. User 모델 tail 패턴 (format된 형식)
// =====================================================================
const oldUserTail = `  quotes           Quote[]
  createdPools     CoBuyPool[]       @relation("PoolCreator")
  poolParticipants PoolParticipant[]
  carrierBids      AuctionBid[]
  wonPools         CoBuyPool[]       @relation("WinningCarrier")
  notifications    Notification[]
}`;

const newUserTail = `  quotes                  Quote[]
  createdPools            CoBuyPool[]         @relation("PoolCreator")
  poolParticipants        PoolParticipant[]
  carrierBids             AuctionBid[]
  wonPools                CoBuyPool[]         @relation("WinningCarrier")
  notifications           Notification[]
  kycProfile              KycProfile?         @relation("UserKycProfile", fields: [kycProfileId], references: [id])
  trustScoreEvents        TrustScore[]        @relation("UserTrustScores")
  trustScoreEventsActor   TrustScore[]        @relation("TrustScoreActor")
  deposits                Deposit[]           @relation("UserDeposits")
  poolExtensions          PoolExtension[]     @relation("PoolExtensionActor")
  auditLogs               AuditLog[]          @relation("AuditLogActor")
  verifiedKycProfiles     KycProfile[]        @relation("KycVerifier")
  kycDocumentsReviewed    KycDocument[]       @relation("KycDocReviewer")
  kycProfileId            Int?                @unique
}`;

if (content.includes(oldUserTail) && !content.includes('kycProfile              KycProfile?')) {
  content = content.replace(oldUserTail, newUserTail);
  console.log('[A3-Patch-v2] ✅ User 모델 확장 완료 (kycProfile/trustScoreEvents/deposits/poolExtensions/auditLogs 관계)');
} else if (content.includes('kycProfile              KycProfile?')) {
  console.log('[A3-Patch-v2] ⏭️  User 모델이 이미 확장되었습니다 (건너뜀)');
} else {
  console.error('[A3-Patch-v2] ❌ User 모델 tail 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// =====================================================================
// 2. AuditLog 모델 확장 (format된 형식)
// =====================================================================
const oldAuditLog = `model AuditLog {
  id         Int      @id @default(autoincrement())
  actorId    Int?
  action     String
  entityType String
  entityId   Int?
  beforeJson Json?
  afterJson  Json?
  createdAt  DateTime @default(now())
}`;

const newAuditLog = `model AuditLog {
  id         Int          @id @default(autoincrement())
  actorId    Int?
  action     String
  actionEnum AuditAction?
  service    String       @default("platform")
  entityType String
  entityId   Int?
  reason     String?
  ipAddress  String?
  userAgent  String?
  beforeJson Json?
  afterJson  Json?
  createdAt  DateTime     @default(now())

  actor User? @relation("AuditLogActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([actorId, createdAt])
  @@index([entityType, entityId])
  @@index([actionEnum])
}`;

if (content.includes(oldAuditLog) && !content.includes('actionEnum AuditAction?')) {
  content = content.replace(oldAuditLog, newAuditLog);
  console.log('[A3-Patch-v2] ✅ AuditLog 모델 확장 완료 (actionEnum/service/reason/ipAddress/userAgent + actor 관계)');
} else if (content.includes('actionEnum AuditAction?')) {
  console.log('[A3-Patch-v2] ⏭️  AuditLog 모델이 이미 확장되었습니다 (건너뜀)');
} else {
  console.error('[A3-Patch-v2] ❌ AuditLog 모델 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// =====================================================================
// 3. CoBuyPool tail 패턴 (format된 형식)
// =====================================================================
const oldCoBuyPoolTail = `  cargoCategory CargoCategory? @relation(fields: [cargoCategoryCode], references: [code])
  cargoSubType  CargoSubType?  @relation(fields: [cargoSubTypeId], references: [id])
  participants  PoolParticipant[]
  bids          AuctionBid[]

  @@index([serviceCode, status, auctionStartUtc, auctionEndUtc])
  @@index([cargoCategoryCode, polCode, podCode, targetEtd])
}`;

const newCoBuyPoolTail = `  cargoCategory CargoCategory? @relation(fields: [cargoCategoryCode], references: [code])
  cargoSubType  CargoSubType?  @relation(fields: [cargoSubTypeId], references: [id])
  participants  PoolParticipant[]
  bids          AuctionBid[]
  extensions    PoolExtension[]
  deposits      Deposit[]

  @@index([serviceCode, status, auctionStartUtc, auctionEndUtc])
  @@index([cargoCategoryCode, polCode, podCode, targetEtd])
}`;

if (content.includes(oldCoBuyPoolTail) && !content.includes('extensions    PoolExtension[]')) {
  content = content.replace(oldCoBuyPoolTail, newCoBuyPoolTail);
  console.log('[A3-Patch-v2] ✅ CoBuyPool 모델 확장 완료 (extensions/deposits 관계)');
} else if (content.includes('extensions    PoolExtension[]')) {
  console.log('[A3-Patch-v2] ⏭️  CoBuyPool 모델이 이미 확장되었습니다 (건너뜀)');
} else {
  console.error('[A3-Patch-v2] ❌ CoBuyPool 모델 tail 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// =====================================================================
// 4. AuctionBid 모델 확장 (format된 형식)
// =====================================================================
const oldAuctionBid = `model AuctionBid {
  id              Int       @id @default(autoincrement())
  poolId          Int
  carrierId       Int
  proposedRateUsd Decimal   @db.Decimal(10, 2)
  bidTime         DateTime  @default(now())
  isWinningAtTime Boolean   @default(false)

  pool    CoBuyPool @relation(fields: [poolId], references: [id])
  carrier User      @relation(fields: [carrierId], references: [id])

  @@index([poolId, proposedRateUsd])
}`;

const newAuctionBid = `model AuctionBid {
  id                  Int       @id @default(autoincrement())
  poolId              Int
  carrierId           Int
  proposedRateUsd     Decimal   @db.Decimal(10, 2)
  bidTime             DateTime  @default(now())
  isWinningAtTime     Boolean   @default(false)
  isSealed            Boolean   @default(false)
  extendedAuction     Boolean   @default(false)
  bidSource           String    @default("MANUAL")
  validUntilUtc       DateTime?

  pool                CoBuyPool @relation(fields: [poolId], references: [id])
  carrier             User      @relation(fields: [carrierId], references: [id])
  triggeredExtensions PoolExtension[]

  @@index([poolId, proposedRateUsd])
}`;

if (content.includes(oldAuctionBid) && !content.includes('triggeredExtensions PoolExtension[]')) {
  content = content.replace(oldAuctionBid, newAuctionBid);
  console.log('[A3-Patch-v2] ✅ AuctionBid 모델 확장 완료 (isSealed/extendedAuction/bidSource/validUntilUtc + triggeredExtensions 관계)');
} else if (content.includes('triggeredExtensions PoolExtension[]')) {
  console.log('[A3-Patch-v2] ⏭️  AuctionBid 모델이 이미 확장되었습니다 (건너뜀)');
} else {
  console.error('[A3-Patch-v2] ❌ AuctionBid 모델 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// =====================================================================
// 5. PoolParticipant 모델 확장 (format된 형식)
// =====================================================================
const oldPoolParticipant = `model PoolParticipant {
  id              Int               @id @default(autoincrement())
  poolId          Int
  userId          Int
  quoteId         Int?
  role            UserRole
  volumeTeu       Decimal           @default(0) @db.Decimal(10, 2)
  volumeCbm       Decimal           @default(0) @db.Decimal(10, 2)
  weightTon       Decimal           @default(0) @db.Decimal(10, 2)
  depositRequired Boolean           @default(false)
  depositAmount   Decimal           @default(0) @db.Decimal(12, 2)
  status          ParticipantStatus @default(JOINED)
  joinedAt        DateTime          @default(now())
  cancelledAt     DateTime?

  pool CoBuyPool @relation(fields: [poolId], references: [id])
  user User      @relation(fields: [userId], references: [id])
  quote Quote?   @relation(fields: [quoteId], references: [id])

  @@unique([poolId, userId])
}`;

const newPoolParticipant = `model PoolParticipant {
  id              Int               @id @default(autoincrement())
  poolId          Int
  userId          Int
  quoteId         Int?
  role            UserRole
  volumeTeu       Decimal           @default(0) @db.Decimal(10, 2)
  volumeCbm       Decimal           @default(0) @db.Decimal(10, 2)
  weightTon       Decimal           @default(0) @db.Decimal(10, 2)
  depositRequired Boolean           @default(false)
  depositAmount   Decimal           @default(0) @db.Decimal(12, 2)
  depositId       Int?
  finalInvoiceId  Int?
  status          ParticipantStatus @default(JOINED)
  joinedAt        DateTime          @default(now())
  cancelledAt     DateTime?
  cancelledReason String?

  pool     CoBuyPool @relation(fields: [poolId], references: [id])
  user     User      @relation(fields: [userId], references: [id])
  quote    Quote?    @relation(fields: [quoteId], references: [id])
  deposit  Deposit?  @relation("ParticipantDeposit", fields: [depositId], references: [id], onDelete: SetNull)

  @@unique([poolId, userId])
  @@index([depositId])
}`;

if (content.includes(oldPoolParticipant) && !content.includes('depositId       Int?')) {
  content = content.replace(oldPoolParticipant, newPoolParticipant);
  console.log('[A3-Patch-v2] ✅ PoolParticipant 모델 확장 완료 (depositId/finalInvoiceId/cancelledReason + deposit 관계)');
} else if (content.includes('depositId       Int?')) {
  console.log('[A3-Patch-v2] ⏭️  PoolParticipant 모델이 이미 확장되었습니다 (건너뜀)');
} else {
  console.error('[A3-Patch-v2] ❌ PoolParticipant 모델 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// =====================================================================
// 6. 신규 모델 5개 추가 (AuditLog 다음 — 가장 마지막에 추가)
// =====================================================================
const newModels = `model KycProfile {
  id                     Int       @id @default(autoincrement())
  userId                 Int       @unique
  legalNameKr            String?
  legalNameEn            String?
  businessRegistrationNo String?   @unique
  corporateRegistrationNo String?
  taxId                  String?
  ceoName                String?
  establishedYear        Int?
  annualRevenueKrw       BigInt    @default(0)
  employeeCount          Int?
  industryCategoryCode   String?
  exportLicenseNo        String?
  customsBrokerLicenseNo String?
  kycStatus              KycStatus @default(PENDING)
  kycTier                KycTier   @default(BASIC)
  kycNote                String?
  verifiedAt             DateTime?
  verifiedByUserId       Int?
  expiresAt              DateTime?
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  user             User           @relation("UserKycProfile", fields: [userId], references: [id], onDelete: Cascade)
  verifiedBy       User?          @relation("KycVerifier", fields: [verifiedByUserId], references: [id], onDelete: SetNull)
  industryCategory CargoCategory? @relation(fields: [industryCategoryCode], references: [code], onDelete: SetNull)
  documents        KycDocument[]

  @@index([kycStatus, kycTier])
  @@index([expiresAt])
}

model KycDocument {
  id               Int               @id @default(autoincrement())
  kycProfileId     Int
  documentType     KycDocumentType
  fileUrl          String
  fileName         String?
  fileSize         Int?
  mimeType         String?
  reviewStatus     KycDocumentStatus @default(PENDING)
  reviewedAt       DateTime?
  reviewedByUserId Int?
  reviewNote       String?
  expiresAt        DateTime?
  uploadedAt       DateTime          @default(now())
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  kycProfile KycProfile @relation(fields: [kycProfileId], references: [id], onDelete: Cascade)
  reviewedBy User?      @relation("KycDocReviewer", fields: [reviewedByUserId], references: [id], onDelete: SetNull)

  @@index([kycProfileId])
  @@index([documentType, reviewStatus])
  @@index([expiresAt])
}

model TrustScore {
  id                Int            @id @default(autoincrement())
  userId            Int
  eventType         TrustEventType
  scoreDelta        Int
  reason            String
  relatedEntityType String?
  relatedEntityId   Int?
  effectiveScore    Int
  actorId           Int?
  createdAt         DateTime       @default(now())

  user  User  @relation("UserTrustScores", fields: [userId], references: [id], onDelete: Cascade)
  actor User? @relation("TrustScoreActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([eventType])
  @@index([relatedEntityType, relatedEntityId])
}

model PoolExtension {
  id               Int                  @id @default(autoincrement())
  poolId           Int
  triggeredAt      DateTime             @default(now())
  triggeredByBidId Int?
  triggerSource    PoolExtensionTrigger @default(AUCTION_BID)
  previousEndUtc   DateTime
  newEndUtc        DateTime
  extensionMinutes Int
  actorId          Int?

  pool           CoBuyPool   @relation(fields: [poolId], references: [id], onDelete: Cascade)
  triggeredByBid AuctionBid? @relation(fields: [triggeredByBidId], references: [id], onDelete: SetNull)
  actor          User?       @relation("PoolExtensionActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([poolId, triggeredAt])
  @@index([actorId])
}

model Deposit {
  id            Int                  @id @default(autoincrement())
  userId        Int
  poolId        Int?
  participantId Int?
  amountKrw     Decimal              @default(0) @db.Decimal(18, 2)
  amountUsd     Decimal              @default(0) @db.Decimal(12, 2)
  currency      String               @default("KRW")
  purpose       DepositPurpose
  status        DepositStatus        @default(PENDING_PAYMENT)
  paymentMethod DepositPaymentMethod?
  paidAt        DateTime?
  refundedAt    DateTime?
  forfeitedAt   DateTime?
  externalRef   String?              @unique
  note          String?
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  user         User              @relation("UserDeposits", fields: [userId], references: [id], onDelete: Cascade)
  pool         CoBuyPool?        @relation(fields: [poolId], references: [id], onDelete: SetNull)
  participants PoolParticipant[] @relation("ParticipantDeposit")

  @@index([userId, status])
  @@index([poolId])
  @@index([purpose, status])
}

model AuditLog {`;

if (!content.includes('model KycProfile')) {
  // AuditLog 패턴 찾기
  const auditLogPattern = /model AuditLog \{[\s\S]*?^\}/m;
  if (auditLogPattern.test(content)) {
    content = content.replace(auditLogPattern, newModels + '\n  id         Int          @id @default(autoincrement())\n  actorId    Int?\n  action     String\n  actionEnum AuditAction?\n  service    String       @default("platform")\n  entityType String\n  entityId   Int?\n  reason     String?\n  ipAddress  String?\n  userAgent  String?\n  beforeJson Json?\n  afterJson  Json?\n  createdAt  DateTime     @default(now())\n\n  actor User? @relation("AuditLogActor", fields: [actorId], references: [id], onDelete: SetNull)\n\n  @@index([actorId, createdAt])\n  @@index([entityType, entityId])\n  @@index([actionEnum])\n}');
    console.log('[A3-Patch-v2] ✅ 5개 신규 모델 추가 완료 (KycProfile, KycDocument, TrustScore, PoolExtension, Deposit)');
  } else {
    console.error('[A3-Patch-v2] ❌ AuditLog 모델을 찾을 수 없습니다. 수동 패치 필요.');
    process.exit(1);
  }
} else {
  console.log('[A3-Patch-v2] ⏭️  신규 모델이 이미 존재합니다 (건너뜀)');
}

// =====================================================================
// 7. CargoCategory에 documents (KycProfile) 역참조 추가
// =====================================================================
const oldCargoCategoryRelations = `  subTypes CargoSubType[]
  quotes   Quote[]
  pools    CoBuyPool[]`;

const newCargoCategoryRelations = `  subTypes    CargoSubType[]
  quotes      Quote[]
  pools       CoBuyPool[]
  kycProfiles KycProfile[]`;

if (content.includes(oldCargoCategoryRelations) && !content.includes('kycProfiles KycProfile[]')) {
  content = content.replace(oldCargoCategoryRelations, newCargoCategoryRelations);
  console.log('[A3-Patch-v2] ✅ CargoCategory에 kycProfiles 역참조 추가');
} else if (content.includes('kycProfiles KycProfile[]')) {
  console.log('[A3-Patch-v2] ⏭️  CargoCategory의 kycProfiles가 이미 추가됨');
}

// =====================================================================
// 8. 파일 저장
// =====================================================================
fs.writeFileSync(SCHEMA_PATH, content, 'utf8');
console.log('[A3-Patch-v2] ✅ schema.prisma 저장 완료');
console.log('');
console.log('[A3-Patch-v2] 다음 단계:');
console.log('  1) npx prisma validate');
console.log('  2) npx prisma format');
console.log('  3) npx prisma generate');
