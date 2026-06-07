-- =====================================================================
-- A3 마이그레이션 2차: Phase 0 신규 엔터티 (D-4)
-- 작성 근거: docs/MASTER_RECONCILIATION.md §3.4
-- 작성일:   2026-06-07
-- 적용 방법: prisma migrate deploy
-- 롤백 방법: prisma migrate resolve --rolled-back 20260607234000_a3_d4_phase0_entities
-- =====================================================================
--
-- 본 마이그레이션은 다음 Phase 0 신규 엔터티를 추가합니다:
--   - KycProfile       (기업 KYC 프로파일)
--   - KycDocument      (KYC 문서 메타데이터)
--   - TrustScore       (행동 기반 신용 점수 이벤트)
--   - PoolExtension    (역경매 안티 스나이핑 연장 로그)
--   - Deposit          (보증금/예치금)
--   - AuditLog 확장    (감사 로그 — 기존 테이블 보존, 필드 추가)
--
-- 기존 AuditLog 테이블은 보존하며 일부 필드만 추가합니다.
-- 기존 User.trustScore (Int) 필드는 denormalized snapshot으로 유지됩니다.
-- =====================================================================


-- =====================================================================
-- Part 1. 신규 ENUM 타입 생성
-- =====================================================================

-- 1-1. KycTier
CREATE TYPE "KycTier" AS ENUM (
  'BASIC', 'VERIFIED', 'PREMIUM'
);

-- 1-2. KycStatus
CREATE TYPE "KycStatus" AS ENUM (
  'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'SUSPENDED'
);

-- 1-3. KycDocumentType
CREATE TYPE "KycDocumentType" AS ENUM (
  'BUSINESS_REGISTRATION',
  'EXPORT_LICENSE',
  'TAX_CERTIFICATE',
  'BANK_STATEMENT',
  'CEO_ID',
  'INSURANCE_CERT',
  'SCAC_CODE',
  'NVOCC_LICENSE',
  'FIATA_CERT',
  'OTHER'
);

-- 1-4. KycDocumentStatus
CREATE TYPE "KycDocumentStatus" AS ENUM (
  'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'
);

-- 1-5. TrustEventType (이벤트 종류)
CREATE TYPE "TrustEventType" AS ENUM (
  'POOL_JOIN_SUCCESS',
  'POOL_COMPLETED_ON_TIME',
  'BID_NO_SHOW',
  'PAYMENT_DELAY',
  'KYC_RENEWED',
  'KYC_REJECTED',
  'DISPUTE_LOST',
  'POOL_CANCELLED',
  'BID_REJECTED',
  'CARRIER_NO_SHOW',
  'CARRIER_NORMAL_BOOKING',
  'CARRIER_FREIGHT_TABLE_LAPSED',
  'ADMIN_ADJUST',
  'INACTIVITY_BONUS'
);

-- 1-6. DepositStatus
CREATE TYPE "DepositStatus" AS ENUM (
  'PENDING_PAYMENT',
  'HELD',
  'REFUNDED',
  'FORFEITED',
  'APPLIED_TO_INVOICE',
  'CANCELLED'
);

-- 1-7. DepositPurpose
CREATE TYPE "DepositPurpose" AS ENUM (
  'POOL_DEPOSIT',
  'BID_DEPOSIT',
  'PENALTY_HOLD',
  'CARRIER_PERFORMANCE'
);

-- 1-8. DepositPaymentMethod
CREATE TYPE "DepositPaymentMethod" AS ENUM (
  'BANK_TRANSFER',
  'CARD',
  'VIRTUAL_ACCOUNT',
  'CREDIT_CARD_AUTH'
);

-- 1-9. PoolExtensionTrigger (안티 스나이핑 트리거)
CREATE TYPE "PoolExtensionTrigger" AS ENUM (
  'AUCTION_BID',
  'ADMIN_MANUAL',
  'SYSTEM_AUTO'
);

-- =====================================================================
-- Part 2. KycProfile 테이블 생성
-- =====================================================================
CREATE TABLE "KycProfile" (
  "id"                       SERIAL          NOT NULL,
  "userId"                   INTEGER         NOT NULL,
  "legalNameKr"              TEXT,
  "legalNameEn"              TEXT,
  "businessRegistrationNo"   TEXT,
  "corporateRegistrationNo"  TEXT,
  "taxId"                    TEXT,
  "ceoName"                  TEXT,
  "establishedYear"          INTEGER,
  "annualRevenueKrw"         BIGINT          NOT NULL DEFAULT 0,
  "employeeCount"            INTEGER,
  "industryCategoryCode"     TEXT,
  "exportLicenseNo"          TEXT,
  "customsBrokerLicenseNo"   TEXT,
  "kycStatus"                "KycStatus"     NOT NULL DEFAULT 'PENDING',
  "kycTier"                  "KycTier"       NOT NULL DEFAULT 'BASIC',
  "kycNote"                  TEXT,
  "verifiedAt"               TIMESTAMP(3),
  "verifiedByUserId"         INTEGER,
  "expiresAt"                TIMESTAMP(3),
  "createdAt"                TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                TIMESTAMP(3)    NOT NULL,
  CONSTRAINT "KycProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KycProfile_userId_key" ON "KycProfile"("userId");
CREATE UNIQUE INDEX "KycProfile_businessRegistrationNo_key" 
  ON "KycProfile"("businessRegistrationNo");
CREATE INDEX "KycProfile_kycStatus_kycTier_idx" 
  ON "KycProfile"("kycStatus", "kycTier");
CREATE INDEX "KycProfile_expiresAt_idx" ON "KycProfile"("expiresAt");

-- 외래키
ALTER TABLE "KycProfile"
  ADD CONSTRAINT "KycProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KycProfile"
  ADD CONSTRAINT "KycProfile_verifiedByUserId_fkey"
  FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KycProfile"
  ADD CONSTRAINT "KycProfile_industryCategoryCode_fkey"
  FOREIGN KEY ("industryCategoryCode") REFERENCES "CargoCategory"("code")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- Part 3. KycDocument 테이블 생성
-- =====================================================================
CREATE TABLE "KycDocument" (
  "id"            SERIAL              NOT NULL,
  "kycProfileId"  INTEGER             NOT NULL,
  "documentType"  "KycDocumentType"   NOT NULL,
  "fileUrl"       TEXT                NOT NULL,
  "fileName"      TEXT,
  "fileSize"      INTEGER,
  "mimeType"      TEXT,
  "reviewStatus"  "KycDocumentStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedAt"    TIMESTAMP(3),
  "reviewedByUserId" INTEGER,
  "reviewNote"    TEXT,
  "expiresAt"     TIMESTAMP(3),
  "uploadedAt"    TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"     TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)        NOT NULL,
  CONSTRAINT "KycDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KycDocument_kycProfileId_idx" ON "KycDocument"("kycProfileId");
CREATE INDEX "KycDocument_documentType_reviewStatus_idx" 
  ON "KycDocument"("documentType", "reviewStatus");
CREATE INDEX "KycDocument_expiresAt_idx" ON "KycDocument"("expiresAt");

-- 외래키
ALTER TABLE "KycDocument"
  ADD CONSTRAINT "KycDocument_kycProfileId_fkey"
  FOREIGN KEY ("kycProfileId") REFERENCES "KycProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KycDocument"
  ADD CONSTRAINT "KycDocument_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- Part 4. TrustScore 테이블 생성
-- =====================================================================
CREATE TABLE "TrustScore" (
  "id"                 SERIAL            NOT NULL,
  "userId"             INTEGER           NOT NULL,
  "eventType"          "TrustEventType"  NOT NULL,
  "scoreDelta"         INTEGER           NOT NULL,
  "reason"             TEXT              NOT NULL,
  "relatedEntityType"  TEXT,
  "relatedEntityId"    INTEGER,
  "effectiveScore"     INTEGER           NOT NULL,
  "actorId"            INTEGER,
  "createdAt"          TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustScore_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TrustScore_userId_createdAt_idx" 
  ON "TrustScore"("userId", "createdAt" DESC);
CREATE INDEX "TrustScore_eventType_idx" ON "TrustScore"("eventType");
CREATE INDEX "TrustScore_relatedEntityType_relatedEntityId_idx" 
  ON "TrustScore"("relatedEntityType", "relatedEntityId");

-- 외래키
ALTER TABLE "TrustScore"
  ADD CONSTRAINT "TrustScore_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrustScore"
  ADD CONSTRAINT "TrustScore_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- Part 5. PoolExtension 테이블 생성
-- =====================================================================
CREATE TABLE "PoolExtension" (
  "id"               SERIAL                  NOT NULL,
  "poolId"           INTEGER                 NOT NULL,
  "triggeredAt"      TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "triggeredByBidId" INTEGER,
  "triggerSource"    "PoolExtensionTrigger"  NOT NULL DEFAULT 'AUCTION_BID',
  "previousEndUtc"   TIMESTAMP(3)            NOT NULL,
  "newEndUtc"        TIMESTAMP(3)            NOT NULL,
  "extensionMinutes" INTEGER                 NOT NULL,
  "actorId"          INTEGER,
  CONSTRAINT "PoolExtension_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PoolExtension_poolId_triggeredAt_idx" 
  ON "PoolExtension"("poolId", "triggeredAt" DESC);
CREATE INDEX "PoolExtension_actorId_idx" ON "PoolExtension"("actorId");

-- 외래키
ALTER TABLE "PoolExtension"
  ADD CONSTRAINT "PoolExtension_poolId_fkey"
  FOREIGN KEY ("poolId") REFERENCES "CoBuyPool"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PoolExtension"
  ADD CONSTRAINT "PoolExtension_triggeredByBidId_fkey"
  FOREIGN KEY ("triggeredByBidId") REFERENCES "AuctionBid"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PoolExtension"
  ADD CONSTRAINT "PoolExtension_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- Part 6. Deposit 테이블 생성
-- =====================================================================
CREATE TABLE "Deposit" (
  "id"               SERIAL                  NOT NULL,
  "userId"           INTEGER                 NOT NULL,
  "poolId"           INTEGER,
  "participantId"    INTEGER,
  "amountKrw"        DECIMAL(18, 2)          NOT NULL DEFAULT 0,
  "amountUsd"        DECIMAL(12, 2)          NOT NULL DEFAULT 0,
  "currency"         TEXT                    NOT NULL DEFAULT 'KRW',
  "purpose"          "DepositPurpose"        NOT NULL,
  "status"           "DepositStatus"         NOT NULL DEFAULT 'PENDING_PAYMENT',
  "paymentMethod"    "DepositPaymentMethod",
  "paidAt"           TIMESTAMP(3),
  "refundedAt"       TIMESTAMP(3),
  "forfeitedAt"      TIMESTAMP(3),
  "externalRef"      TEXT,
  "note"             TEXT,
  "createdAt"        TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3)            NOT NULL,
  CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Deposit_userId_status_idx" 
  ON "Deposit"("userId", "status");
CREATE INDEX "Deposit_poolId_idx" ON "Deposit"("poolId");
CREATE INDEX "Deposit_participantId_idx" ON "Deposit"("participantId");
CREATE INDEX "Deposit_purpose_status_idx" 
  ON "Deposit"("purpose", "status");
CREATE UNIQUE INDEX "Deposit_externalRef_key" 
  ON "Deposit"("externalRef") WHERE "externalRef" IS NOT NULL;

-- 외래키
ALTER TABLE "Deposit"
  ADD CONSTRAINT "Deposit_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Deposit"
  ADD CONSTRAINT "Deposit_poolId_fkey"
  FOREIGN KEY ("poolId") REFERENCES "CoBuyPool"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Deposit"
  ADD CONSTRAINT "Deposit_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "PoolParticipant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- Part 7. PoolParticipant 확장 (depositId 컬럼)
-- =====================================================================
ALTER TABLE "PoolParticipant" ADD COLUMN "depositId" INTEGER;
CREATE INDEX "PoolParticipant_depositId_idx" ON "PoolParticipant"("depositId");

ALTER TABLE "PoolParticipant"
  ADD CONSTRAINT "PoolParticipant_depositId_fkey"
  FOREIGN KEY ("depositId") REFERENCES "Deposit"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- Part 8. User 테이블 확장 (KycProfile 직접 FK)
-- =====================================================================
ALTER TABLE "User" ADD COLUMN "kycProfileId" INTEGER;
CREATE UNIQUE INDEX "User_kycProfileId_key" ON "User"("kycProfileId");

-- KycProfile과의 양방향 관계를 위해 KycProfile에 userId FK는 이미 있으므로
-- User.kycProfileId는 별도 redundant FK로 denormalized
-- (선택적) — 필요시 아래 주석 해제:
-- ALTER TABLE "User"
--   ADD CONSTRAINT "User_kycProfileId_fkey"
--   FOREIGN KEY ("kycProfileId") REFERENCES "KycProfile"("id")
--   ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- Part 9. AuditLog 확장 (action enum 도입, 기존 action 컬럼 보존)
-- =====================================================================
-- 기존 AuditLog.action 컬럼은 TEXT로 유지 (하위 호환)
-- 신규 AuditAction enum 도입 (선택적 — TypeScript 측에서 enum 매핑)
CREATE TYPE "AuditAction" AS ENUM (
  -- 사용자/계정
  'USER_STATUS_UPDATE',
  'USER_KYC_APPROVED',
  'USER_KYC_REJECTED',
  'USER_TRUST_SCORE_ADJUST',
  -- 풀/견적
  'POOL_CREATED',
  'POOL_OVERRIDE',
  'POOL_CANCELLED',
  'POOL_AUCTION_EXTENDED',
  'POOL_AWARDED',
  'QUOTE_CREATED',
  'QUOTE_CLUSTERED',
  -- 경매
  'BID_SUBMITTED',
  'BID_REJECTED',
  -- 보증금/정산
  'DEPOSIT_HELD',
  'DEPOSIT_REFUNDED',
  'DEPOSIT_FORFEITED',
  'INVOICE_ISSUED',
  'INVOICE_PAID',
  -- 운임/시장
  'LIMIT_OVERRIDE_TRIGGER',
  'FREIGHT_TABLE_UPDATED',
  -- 시스템
  'LOGIN',
  'LOGOUT',
  'ADMIN_ACTION',
  'OTHER'
);

ALTER TABLE "AuditLog" ADD COLUMN "actionEnum" "AuditAction";
ALTER TABLE "AuditLog" ADD COLUMN "service" TEXT NOT NULL DEFAULT 'platform';
ALTER TABLE "AuditLog" ADD COLUMN "reason" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "userAgent" TEXT;

CREATE INDEX "AuditLog_actorId_createdAt_idx" 
  ON "AuditLog"("actorId", "createdAt" DESC);
CREATE INDEX "AuditLog_entityType_entityId_idx" 
  ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_actionEnum_idx" ON "AuditLog"("actionEnum");

-- =====================================================================
-- Part 10. User 테이블 확장 (kycTier, trustScore denormalized 보존 확인)
-- =====================================================================
-- 기존 User.trustScore (Int) 필드는 denormalized snapshot으로 유지
-- 기존 User.membershipLevel (String) 필드는 kycTier 표기로 활용 가능
-- 추가 컬럼은 도입하지 않음 (KycProfile을 단일 진실 공급원으로 사용)

-- =====================================================================
-- 검증용 SELECT (적용 후 확인용, 주석 처리)
-- =====================================================================
-- SELECT 'KycProfile' AS table_name, COUNT(*) AS cnt FROM "KycProfile"
-- UNION ALL
-- SELECT 'KycDocument', COUNT(*) FROM "KycDocument"
-- UNION ALL
-- SELECT 'TrustScore', COUNT(*) FROM "TrustScore"
-- UNION ALL
-- SELECT 'PoolExtension', COUNT(*) FROM "PoolExtension"
-- UNION ALL
-- SELECT 'Deposit', COUNT(*) FROM "Deposit";


-- =====================================================================
-- [schema.prisma 수동 변경 가이드 / 패치 스크립트]
-- 본 마이그레이션 적용 후, prisma/schema.prisma에 다음을 추가해야 합니다:
--
-- 1) 신규 enum (9개)
--    enum KycTier { BASIC VERIFIED PREMIUM }
--    enum KycStatus { PENDING IN_REVIEW APPROVED REJECTED EXPIRED SUSPENDED }
--    enum KycDocumentType { ... }
--    enum KycDocumentStatus { PENDING APPROVED REJECTED EXPIRED }
--    enum TrustEventType { ... }
--    enum DepositStatus { PENDING_PAYMENT HELD REFUNDED FORFEITED APPLIED_TO_INVOICE CANCELLED }
--    enum DepositPurpose { POOL_DEPOSIT BID_DEPOSIT PENALTY_HOLD CARRIER_PERFORMANCE }
--    enum DepositPaymentMethod { BANK_TRANSFER CARD VIRTUAL_ACCOUNT CREDIT_CARD_AUTH }
--    enum PoolExtensionTrigger { AUCTION_BID ADMIN_MANUAL SYSTEM_AUTO }
--    enum AuditAction { ... }
--
-- 2) 신규 모델 (5개)
--    model KycProfile { ... }
--    model KycDocument { ... }
--    model TrustScore { ... }
--    model PoolExtension { ... }
--    model Deposit { ... }
--
-- 3) 기존 모델 확장
--    model User { kycProfile KycProfile? @relation(...) }
--    model PoolParticipant { deposit Deposit? @relation(...) depositId Int? }
--    model AuditLog { actionEnum AuditAction? service String reason String? ipAddress String? userAgent String? }
--    model CoBuyPool { extensions PoolExtension[] deposits Deposit[] }
--    model AuctionBid { triggeredExtensions PoolExtension[] }
--    model PoolParticipant { deposits Deposit[] }
--
-- 4) 검증
--    npx prisma validate
--    npx prisma format
--    npx prisma generate
-- =====================================================================
