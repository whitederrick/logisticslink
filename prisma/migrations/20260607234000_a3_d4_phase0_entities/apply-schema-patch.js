#!/usr/bin/env node
/* eslint-disable */
// =====================================================================
// A3 schema.prisma 패치 적용 스크립트
// 사용법: node prisma/migrations/20260607234000_a3_d4_phase0_entities/apply-schema-patch.js
// 결과: prisma/schema.prisma에 Phase 0 신규 엔터티 추가
// =====================================================================

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.resolve(__dirname, '../../../prisma/schema.prisma');
const BACKUP_PATH = SCHEMA_PATH + '.bak.a3';

console.log('[A3-Patch] schema.prisma 패치를 시작합니다...');
console.log('[A3-Patch] Schema 경로:', SCHEMA_PATH);

if (!fs.existsSync(BACKUP_PATH)) {
  fs.copyFileSync(SCHEMA_PATH, BACKUP_PATH);
  console.log('[A3-Patch] 백업 생성됨:', BACKUP_PATH);
}

let content = fs.readFileSync(SCHEMA_PATH, 'utf8');

// =====================================================================
// 1. 신규 Enum 추가 (HazmatClass 다음, CargoCategory 이전)
// =====================================================================
const anchor1 = `enum HazmatClass {
  CLASS_1
  CLASS_2
  CLASS_3
  CLASS_4
  CLASS_5
  CLASS_6
  CLASS_7
  CLASS_8
  CLASS_9
}`;

const newEnums1 = `enum HazmatClass {
  CLASS_1
  CLASS_2
  CLASS_3
  CLASS_4
  CLASS_5
  CLASS_6
  CLASS_7
  CLASS_8
  CLASS_9
}

enum KycTier {
  BASIC
  VERIFIED
  PREMIUM
}

enum KycStatus {
  PENDING
  IN_REVIEW
  APPROVED
  REJECTED
  EXPIRED
  SUSPENDED
}

enum KycDocumentType {
  BUSINESS_REGISTRATION
  EXPORT_LICENSE
  TAX_CERTIFICATE
  BANK_STATEMENT
  CEO_ID
  INSURANCE_CERT
  SCAC_CODE
  NVOCC_LICENSE
  FIATA_CERT
  OTHER
}

enum KycDocumentStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

enum TrustEventType {
  POOL_JOIN_SUCCESS
  POOL_COMPLETED_ON_TIME
  BID_NO_SHOW
  PAYMENT_DELAY
  KYC_RENEWED
  KYC_REJECTED
  DISPUTE_LOST
  POOL_CANCELLED
  BID_REJECTED
  CARRIER_NO_SHOW
  CARRIER_NORMAL_BOOKING
  CARRIER_FREIGHT_TABLE_LAPSED
  ADMIN_ADJUST
  INACTIVITY_BONUS
}

enum DepositStatus {
  PENDING_PAYMENT
  HELD
  REFUNDED
  FORFEITED
  APPLIED_TO_INVOICE
  CANCELLED
}

enum DepositPurpose {
  POOL_DEPOSIT
  BID_DEPOSIT
  PENALTY_HOLD
  CARRIER_PERFORMANCE
}

enum DepositPaymentMethod {
  BANK_TRANSFER
  CARD
  VIRTUAL_ACCOUNT
  CREDIT_CARD_AUTH
}

enum PoolExtensionTrigger {
  AUCTION_BID
  ADMIN_MANUAL
  SYSTEM_AUTO
}

enum AuditAction {
  USER_STATUS_UPDATE
  USER_KYC_APPROVED
  USER_KYC_REJECTED
  USER_TRUST_SCORE_ADJUST
  POOL_CREATED
  POOL_OVERRIDE
  POOL_CANCELLED
  POOL_AUCTION_EXTENDED
  POOL_AWARDED
  QUOTE_CREATED
  QUOTE_CLUSTERED
  BID_SUBMITTED
  BID_REJECTED
  DEPOSIT_HELD
  DEPOSIT_REFUNDED
  DEPOSIT_FORFEITED
  INVOICE_ISSUED
  INVOICE_PAID
  LIMIT_OVERRIDE_TRIGGER
  FREIGHT_TABLE_UPDATED
  LOGIN
  LOGOUT
  ADMIN_ACTION
  OTHER
}`;

if (content.includes(anchor1) && !content.includes('enum KycTier')) {
  content = content.replace(anchor1, newEnums1);
  console.log('[A3-Patch] ✅ 9개 신규 enum 추가 완료 (KycTier, KycStatus, KycDocumentType, KycDocumentStatus, TrustEventType, DepositStatus, DepositPurpose, DepositPaymentMethod, PoolExtensionTrigger, AuditAction)');
} else if (content.includes('enum KycTier')) {
  console.log('[A3-Patch] ⏭️  신규 enum이 이미 존재합니다 (건너뜀)');
} else {
  console.error('[A3-Patch] ❌ HazmatClass enum 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// =====================================================================
// 2. User 모델 확장 (kycProfile 관계 추가)
// =====================================================================
const oldUserTail = `  quotes                Quote[]
  createdPools          CoBuyPool[]         @relation("PoolCreator")
  poolParticipants      PoolParticipant[]
  carrierBids           AuctionBid[]
  wonPools              CoBuyPool[]         @relation("WinningCarrier")
  notifications         Notification[]
}`;

const newUserTail = `  quotes                Quote[]
  createdPools          CoBuyPool[]         @relation("PoolCreator")
  poolParticipants      PoolParticipant[]
  carrierBids           AuctionBid[]
  wonPools              CoBuyPool[]         @relation("WinningCarrier")
  notifications         Notification[]
  kycProfile            KycProfile?         @relation("UserKycProfile", fields: [kycProfileId], references: [id])
  trustScoreEvents      TrustScore[]
  deposits              Deposit[]
  poolExtensions        PoolExtension[]
  auditLogs             AuditLog[]          @relation("AuditLogActor")
  kycProfileId          Int?                @unique
}`;

if (content.includes(oldUserTail) && !content.includes('kycProfile            KycProfile?')) {
  content = content.replace(oldUserTail, newUserTail);
  console.log('[A3-Patch] ✅ User 모델 확장 완료 (kycProfile/trustScoreEvents/deposits/poolExtensions/auditLogs 관계)');
} else if (content.includes('kycProfile            KycProfile?')) {
  console.log('[A3-Patch] ⏭️  User 모델이 이미 확장되었습니다 (건너뜀)');
} else {
  console.error('[A3-Patch] ❌ User 모델 tail 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// =====================================================================
// 3. AuditLog 모델 확장 (actionEnum, service, reason, ipAddress, userAgent 추가)
// =====================================================================
const oldAuditLog = `model AuditLog {
  id          Int      @id @default(autoincrement())
  actorId     Int?
  action      String
  entityType  String
  entityId    Int?
  beforeJson  Json?
  afterJson   Json?
  createdAt   DateTime @default(now())
}`;

const newAuditLog = `model AuditLog {
  id          Int          @id @default(autoincrement())
  actorId     Int?
  action      String
  actionEnum  AuditAction?
  service     String       @default("platform")
  entityType  String
  entityId    Int?
  reason      String?
  ipAddress   String?
  userAgent   String?
  beforeJson  Json?
  afterJson   Json?
  createdAt   DateTime     @default(now())

  actor       User?        @relation("AuditLogActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([actorId, createdAt])
  @@index([entityType, entityId])
  @@index([actionEnum])
}`;

if (content.includes(oldAuditLog) && !content.includes('actionEnum  AuditAction?')) {
  content = content.replace(oldAuditLog, newAuditLog);
  console.log('[A3-Patch] ✅ AuditLog 모델 확장 완료 (actionEnum/service/reason/ipAddress/userAgent + actor 관계)');
} else if (content.includes('actionEnum  AuditAction?')) {
  console.log('[A3-Patch] ⏭️  AuditLog 모델이 이미 확장되었습니다 (건너뜀)');
} else {
  console.error('[A3-Patch] ❌ AuditLog 모델 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// =====================================================================
// 4. CoBuyPool 모델 확장 (extensions, deposits 관계 추가)
// =====================================================================
const oldCoBuyPoolTail = `  cargoCategory      CargoCategory? @relation(fields: [cargoCategoryCode], references: [code])
  cargoSubType       CargoSubType?  @relation(fields: [cargoSubTypeId], references: [id])
  participants       PoolParticipant[]
  bids               AuctionBid[]

  @@index([serviceCode, status, auctionStartUtc, auctionEndUtc])
  @@index([cargoCategoryCode, polCode, podCode, targetEtd])
}`;

const newCoBuyPoolTail = `  cargoCategory      CargoCategory? @relation(fields: [cargoCategoryCode], references: [code])
  cargoSubType       CargoSubType?  @relation(fields: [cargoSubTypeId], references: [id])
  participants       PoolParticipant[]
  bids               AuctionBid[]
  extensions         PoolExtension[]
  deposits           Deposit[]

  @@index([serviceCode, status, auctionStartUtc, auctionEndUtc])
  @@index([cargoCategoryCode, polCode, podCode, targetEtd])
}`;

if (content.includes(oldCoBuyPoolTail) && !content.includes('extensions         PoolExtension[]')) {
  content = content.replace(oldCoBuyPoolTail, newCoBuyPoolTail);
  console.log('[A3-Patch] ✅ CoBuyPool 모델 확장 완료 (extensions/deposits 관계)');
} else if (content.includes('extensions         PoolExtension[]')) {
  console.log('[A3-Patch] ⏭️  CoBuyPool 모델이 이미 확장되었습니다 (건너뜀)');
} else {
  console.error('[A3-Patch] ❌ CoBuyPool 모델 tail 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// =====================================================================
// 5. AuctionBid 모델 확장 (triggeredExtensions 관계 추가)
// =====================================================================
const oldAuctionBid = `model AuctionBid {
  id              Int       @id @default(autoincrement())
  poolId          Int
  carrierId       Int
  proposedRateUsd Decimal   @db.Decimal(10, 2)
  bidTime         DateTime  @default(now())
  isWinningAtTime Boolean   @default(false)

  pool            CoBuyPool @relation(fields: [poolId], references: [id])
  carrier         User      @relation(fields: [carrierId], references: [id])

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
  console.log('[A3-Patch] ✅ AuctionBid 모델 확장 완료 (isSealed/extendedAuction/bidSource/validUntilUtc + triggeredExtensions 관계)');
} else if (content.includes('triggeredExtensions PoolExtension[]')) {
  console.log('[A3-Patch] ⏭️  AuctionBid 모델이 이미 확장되었습니다 (건너뜀)');
} else {
  console.error('[A3-Patch] ❌ AuctionBid 모델 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// =====================================================================
// 6. PoolParticipant 모델 확장 (depositId, deposit 관계 추가)
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

  pool            CoBuyPool         @relation(fields: [poolId], references: [id])
  user            User              @relation(fields: [userId], references: [id])
  quote           Quote?            @relation(fields: [quoteId], references: [id])

  @@unique([poolId, userId])
}`;

const newPoolParticipant = `model PoolParticipant {
  id                 Int               @id @default(autoincrement())
  poolId             Int
  userId             Int
  quoteId            Int?
  role               UserRole
  volumeTeu          Decimal           @default(0) @db.Decimal(10, 2)
  volumeCbm          Decimal           @default(0) @db.Decimal(10, 2)
  weightTon          Decimal           @default(0) @db.Decimal(10, 2)
  depositRequired    Boolean           @default(false)
  depositAmount      Decimal           @default(0) @db.Decimal(12, 2)
  depositId          Int?
  finalInvoiceId     Int?
  status             ParticipantStatus @default(JOINED)
  joinedAt           DateTime          @default(now())
  cancelledAt        DateTime?
  cancelledReason    String?

  pool               CoBuyPool         @relation(fields: [poolId], references: [id])
  user               User              @relation(fields: [userId], references: [id])
  quote              Quote?            @relation(fields: [quoteId], references: [id])
  deposit            Deposit?          @relation(fields: [depositId], references: [id], onDelete: SetNull)

  @@unique([poolId, userId])
  @@index([depositId])
}`;

if (content.includes(oldPoolParticipant) && !content.includes('depositId          Int?')) {
  content = content.replace(oldPoolParticipant, newPoolParticipant);
  console.log('[A3-Patch] ✅ PoolParticipant 모델 확장 완료 (depositId/finalInvoiceId/cancelledReason + deposit 관계)');
} else if (content.includes('depositId          Int?')) {
  console.log('[A3-Patch] ⏭️  PoolParticipant 모델이 이미 확장되었습니다 (건너뜀)');
} else {
  console.error('[A3-Patch] ❌ PoolParticipant 모델 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// =====================================================================
// 7. 신규 모델 5개 추가 (AuditLog 다음 — 가장 마지막에 추가)
// =====================================================================
const auditLogAnchor = `model AuditLog {`;
// 1) 현재 AuditLog 끝 패턴 (이미 위에서 확장됨)
const auditLogEndPattern = `  actor       User?        @relation("AuditLogActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([actorId, createdAt])
  @@index([entityType, entityId])
  @@index([actionEnum])
}`;

const newModels = `model KycProfile {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @unique
  legalNameKr             String?
  legalNameEn             String?
  businessRegistrationNo  String?   @unique
  corporateRegistrationNo String?
  taxId                   String?
  ceoName                 String?
  establishedYear         Int?
  annualRevenueKrw        BigInt    @default(0)
  employeeCount           Int?
  industryCategoryCode    String?
  exportLicenseNo         String?
  customsBrokerLicenseNo  String?
  kycStatus               KycStatus @default(PENDING)
  kycTier                 KycTier   @default(BASIC)
  kycNote                 String?
  verifiedAt              DateTime?
  verifiedByUserId        Int?
  expiresAt               DateTime?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  user                    User      @relation("UserKycProfile", fields: [userId], references: [id], onDelete: Cascade)
  verifiedBy              User?     @relation("KycVerifier", fields: [verifiedByUserId], references: [id], onDelete: SetNull)
  industryCategory        CargoCategory? @relation(fields: [industryCategoryCode], references: [code], onDelete: SetNull)
  documents               KycDocument[]

  @@index([kycStatus, kycTier])
  @@index([expiresAt])
}

model KycDocument {
  id                Int               @id @default(autoincrement())
  kycProfileId      Int
  documentType      KycDocumentType
  fileUrl           String
  fileName          String?
  fileSize          Int?
  mimeType          String?
  reviewStatus      KycDocumentStatus @default(PENDING)
  reviewedAt        DateTime?
  reviewedByUserId  Int?
  reviewNote        String?
  expiresAt         DateTime?
  uploadedAt        DateTime          @default(now())
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  kycProfile        KycProfile        @relation(fields: [kycProfileId], references: [id], onDelete: Cascade)
  reviewedBy        User?             @relation("KycDocReviewer", fields: [reviewedByUserId], references: [id], onDelete: SetNull)

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

  user              User           @relation("UserTrustScores", fields: [userId], references: [id], onDelete: Cascade)
  actor             User?          @relation("TrustScoreActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([eventType])
  @@index([relatedEntityType, relatedEntityId])
}

model PoolExtension {
  id               Int                   @id @default(autoincrement())
  poolId           Int
  triggeredAt      DateTime              @default(now())
  triggeredByBidId Int?
  triggerSource    PoolExtensionTrigger  @default(AUCTION_BID)
  previousEndUtc   DateTime
  newEndUtc        DateTime
  extensionMinutes Int
  actorId          Int?

  pool             CoBuyPool             @relation(fields: [poolId], references: [id], onDelete: Cascade)
  triggeredByBid   AuctionBid?           @relation(fields: [triggeredByBidId], references: [id], onDelete: SetNull)
  actor            User?                 @relation("PoolExtensionActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([poolId, triggeredAt])
  @@index([actorId])
}

model Deposit {
  id              Int                 @id @default(autoincrement())
  userId          Int
  poolId          Int?
  participantId   Int?
  amountKrw       Decimal             @default(0) @db.Decimal(18, 2)
  amountUsd       Decimal             @default(0) @db.Decimal(12, 2)
  currency        String              @default("KRW")
  purpose         DepositPurpose
  status          DepositStatus       @default(PENDING_PAYMENT)
  paymentMethod   DepositPaymentMethod?
  paidAt          DateTime?
  refundedAt      DateTime?
  forfeitedAt     DateTime?
  externalRef     String?             @unique
  note            String?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  user            User                @relation("UserDeposits", fields: [userId], references: [id], onDelete: Cascade)
  pool            CoBuyPool?          @relation(fields: [poolId], references: [id], onDelete: SetNull)
  participants    PoolParticipant[]   @relation("ParticipantDeposit")

  @@index([userId, status])
  @@index([poolId])
  @@index([purpose, status])
}

model AuditLog {`;

if (content.includes(auditLogEndPattern) && !content.includes('model KycProfile')) {
  content = content.replace(auditLogEndPattern, newModels + auditLogEndPattern);
  console.log('[A3-Patch] ✅ 5개 신규 모델 추가 완료 (KycProfile, KycDocument, TrustScore, PoolExtension, Deposit)');
} else if (content.includes('model KycProfile')) {
  console.log('[A3-Patch] ⏭️  신규 모델이 이미 존재합니다 (건너뜀)');
} else {
  console.error('[A3-Patch] ❌ AuditLog 끝 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// =====================================================================
// 8. 추가 User 관계 정의 (이미 2단계에서 kycProfile/trustScoreEvents/deposits/poolExtensions/auditLogs 추가됨)
//    KycDocument.reviewedBy, KycProfile.verifiedBy 등은 위 모델에 직접 정의됨
//    단, 위 모델에서 사용된 "User @relation(...)" 이름들이 User 측에 정의되어야 함
//    우리는 위 2단계에서 다음을 User에 추가함: kycProfile, trustScoreEvents, deposits, poolExtensions, auditLogs, kycProfileId
//    추가로 필요한 것: verifiedKycProfiles (KycProfile.verifiedBy), kycDocumentsReviewed (KycDocument.reviewedBy),
//    trustScoreEventsActor (TrustScore.actor), poolExtensionActions (PoolExtension.actor), userDeposits (Deposit.user)
//
//    가장 안전하게: AuditLog 다음에 추가로 User 측 relation name을 따로 추가하는 것은
//    Prisma의 양방향 relation 규칙 때문에 별도 처리가 필요. 여기서는 schema.prisma의 relation name을
//    단순화하여 단방향 (단일 relation name) 으로 처리하기 위해 일부를 수정.
//
//    위 모델에서 사용한 "User @relation(...)" 매핑:
//    - KycProfile.user          → User.kycProfile         ✅ (위 2단계에서 추가)
//    - KycProfile.verifiedBy    → User.verifiedKycProfiles  (별도 추가 필요)
//    - KycDocument.reviewedBy   → User.kycDocumentsReviewed (별도 추가 필요)
//    - TrustScore.user         → User.trustScoreEvents  ✅ (위 2단계에서 추가)
//    - TrustScore.actor        → User.trustScoreEventsActor (별도 추가 필요)
//    - PoolExtension.actor     → User.poolExtensions     ✅ (위 2단계에서 추가 — name이 같음)
//    - Deposit.user            → User.deposits           ✅ (위 2단계에서 추가)
//
//    위 2단계에서 User에 추가한 relation: kycProfile, trustScoreEvents, deposits, poolExtensions, auditLogs
//    추가로 필요한 relation: verifiedKycProfiles, kycDocumentsReviewed, trustScoreEventsActor
//    userDeposits relation name은 위에서 "deposits"로 통일
// =====================================================================

// User 모델에 누락된 relation 추가
// 현재 User 모델의 relations 영역을 다시 찾아 추가
const userRelationsAnchor = `  kycProfile            KycProfile?         @relation("UserKycProfile", fields: [kycProfileId], references: [id])
  trustScoreEvents      TrustScore[]
  deposits              Deposit[]
  poolExtensions        PoolExtension[]
  auditLogs             AuditLog[]          @relation("AuditLogActor")
  kycProfileId          Int?                @unique
}`;

const userRelationsExtended = `  kycProfile            KycProfile?         @relation("UserKycProfile", fields: [kycProfileId], references: [id])
  trustScoreEvents      TrustScore[]        @relation("UserTrustScores")
  trustScoreEventsActor TrustScore[]        @relation("TrustScoreActor")
  deposits              Deposit[]           @relation("UserDeposits")
  poolExtensions        PoolExtension[]     @relation("PoolExtensionActor")
  auditLogs             AuditLog[]          @relation("AuditLogActor")
  verifiedKycProfiles   KycProfile[]        @relation("KycVerifier")
  kycDocumentsReviewed  KycDocument[]       @relation("KycDocReviewer")
  kycProfileId          Int?                @unique
}`;

if (content.includes(userRelationsAnchor) && !content.includes('verifiedKycProfiles   KycProfile[]')) {
  content = content.replace(userRelationsAnchor, userRelationsExtended);
  console.log('[A3-Patch] ✅ User 모델 양방향 relation 보강 (verifiedKycProfiles/kycDocumentsReviewed/trustScoreEventsActor)');
} else if (content.includes('verifiedKycProfiles   KycProfile[]')) {
  console.log('[A3-Patch] ⏭️  User 모델 양방향 relation이 이미 보강되었습니다 (건너뜀)');
} else {
  console.warn('[A3-Patch] ⚠️  User 모델 relation anchor를 찾지 못했습니다. 양방향 relation 확인 필요.');
}

// =====================================================================
// 9. 파일 저장
// =====================================================================
fs.writeFileSync(SCHEMA_PATH, content, 'utf8');
console.log('[A3-Patch] ✅ schema.prisma 저장 완료');
console.log('');
console.log('[A3-Patch] 다음 단계:');
console.log('  1) npx prisma validate');
console.log('  2) npx prisma format');
console.log('  3) npx prisma generate');
console.log('  4) npx prisma migrate deploy');
