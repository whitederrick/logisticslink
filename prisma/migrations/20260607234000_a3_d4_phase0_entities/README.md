# A3 마이그레이션 적용 가이드 (D-4 Phase 0 신규 엔터티)

> **근거 문서**: [`docs/MASTER_RECONCILIATION.md`](../../../docs/MASTER_RECONCILIATION.md) §3.4
> **작업 일자**: 2026-06-07
> **상태**: 🟢 적용 대기
> **영향도**: High (Phase 0 핵심 인프라)

---

## 0. TL;DR

본 마이그레이션은 Phase 0 신규 엔터티 5개 + 신규 enum 10개 + AuditLog 확장을 추가합니다:

- **신규 모델**: `KycProfile`, `KycDocument`, `TrustScore`, `PoolExtension`, `Deposit`
- **신규 enum**: `KycTier`, `KycStatus`, `KycDocumentType`, `KycDocumentStatus`, `TrustEventType`, `DepositStatus`, `DepositPurpose`, `DepositPaymentMethod`, `PoolExtensionTrigger`, `AuditAction`
- **확장 모델**: `User`, `AuditLog`, `CoBuyPool`, `AuctionBid`, `PoolParticipant`, `CargoCategory`

---

## 1. 적용 순서

### 1.1 사전 점검
```bash
# DB 백업
pg_dump "$DATABASE_URL" > backup_20260607_a3.sql

# A2 마이그레이션 적용 확인
npx prisma migrate status
```

### 1.2 마이그레이션 적용
```bash
npx prisma migrate deploy
```

### 1.3 사후 검증
```bash
npx prisma generate

# 새 테이블 생성 확인
npx prisma db execute --stdin <<EOF
SELECT 'KycProfile' AS tbl, COUNT(*) FROM "KycProfile"
UNION ALL SELECT 'KycDocument', COUNT(*) FROM "KycDocument"
UNION ALL SELECT 'TrustScore', COUNT(*) FROM "TrustScore"
UNION ALL SELECT 'PoolExtension', COUNT(*) FROM "PoolExtension"
UNION ALL SELECT 'Deposit', COUNT(*) FROM "Deposit";
EOF
```

---

## 2. 적용된 변경 (최종)

### 2.1 신규 enum (10개)

| Enum | 값 | 용도 |
|------|-----|------|
| `KycTier` | BASIC, VERIFIED, PREMIUM | 화주/선사 인증 등급 |
| `KycStatus` | PENDING, IN_REVIEW, APPROVED, REJECTED, EXPIRED, SUSPENDED | KYC 진행 상태 |
| `KycDocumentType` | BUSINESS_REGISTRATION, EXPORT_LICENSE, TAX_CERTIFICATE, BANK_STATEMENT, CEO_ID, INSURANCE_CERT, SCAC_CODE, NVOCC_LICENSE, FIATA_CERT, OTHER | KYC 서류 종류 |
| `KycDocumentStatus` | PENDING, APPROVED, REJECTED, EXPIRED | 서류 검토 상태 |
| `TrustEventType` | POOL_JOIN_SUCCESS, BID_NO_SHOW, KYC_RENEWED, ..., INACTIVITY_BONUS (14개) | Trust Score 이벤트 |
| `DepositStatus` | PENDING_PAYMENT, HELD, REFUNDED, FORFEITED, APPLIED_TO_INVOICE, CANCELLED | 보증금 상태 |
| `DepositPurpose` | POOL_DEPOSIT, BID_DEPOSIT, PENALTY_HOLD, CARRIER_PERFORMANCE | 보증금 용도 |
| `DepositPaymentMethod` | BANK_TRANSFER, CARD, VIRTUAL_ACCOUNT, CREDIT_CARD_AUTH | 결제 수단 |
| `PoolExtensionTrigger` | AUCTION_BID, ADMIN_MANUAL, SYSTEM_AUTO | 역경매 연장 트리거 |
| `AuditAction` | USER_STATUS_UPDATE, KYC_APPROVED, ..., OTHER (25개) | 감사 로그 액션 |

### 2.2 신규 모델 (5개)

| 모델 | 핵심 필드 | 관계 |
|------|----------|------|
| `KycProfile` | userId(unique), businessRegistrationNo(unique), kycStatus, kycTier, verifiedByUserId, expiresAt | User (1:1, FK: KycProfile.userId), CargoCategory (industryCategoryCode), KycDocument[] |
| `KycDocument` | kycProfileId, documentType, fileUrl, reviewStatus, expiresAt | KycProfile (1:N), User (reviewer) |
| `TrustScore` | userId, eventType, scoreDelta, effectiveScore, relatedEntityType/Id | User, User (actor) |
| `PoolExtension` | poolId, triggeredByBidId, triggerSource, previousEndUtc, newEndUtc, extensionMinutes | CoBuyPool, AuctionBid, User (actor) |
| `Deposit` | userId, poolId, participantId, amountKrw, amountUsd, purpose, status, paymentMethod, externalRef(unique) | User, CoBuyPool, PoolParticipant[] |

### 2.3 확장 모델

| 모델 | 추가된 필드 | 추가된 관계 |
|------|------------|------------|
| `User` | kycProfileId(unique) | kycProfile (1:1), trustScoreEvents, trustScoreEventsActor, deposits, poolExtensions, auditLogs, verifiedKycProfiles, kycDocumentsReviewed |
| `AuditLog` | actionEnum, service, reason, ipAddress, userAgent | actor (User) |
| `CoBuyPool` | - | extensions, deposits |
| `AuctionBid` | isSealed, extendedAuction, bidSource, validUntilUtc | triggeredExtensions |
| `PoolParticipant` | depositId, finalInvoiceId, cancelledReason | deposit |
| `CargoCategory` | - | kycProfiles |

### 2.4 인덱스 추가

- `KycProfile`: `expiresAt` (기존 `kycStatus, kycTier`는 enum 인덱스 불가로 제거)
- `KycDocument`: `expiresAt` (기존 `documentType, reviewStatus`는 enum 인덱스 불가로 제거)
- `TrustScore`: `userId, createdAt`, `relatedEntityType, relatedEntityId` (기존 `eventType` enum 인덱스 제거)
- `Deposit`: `userId, createdAt`, `poolId`, `purpose` (기존 `userId, status` / `purpose, status` enum 인덱스 제거)
- `PoolExtension`: `poolId, triggeredAt`, `actorId`
- `PoolParticipant`: `depositId`

---

## 3. 롤백 절차

```bash
# 1. Prisma 마이그레이션 롤백 마킹
npx prisma migrate resolve --rolled-back 20260607234000_a3_d4_phase0_entities

# 2. 수동 롤백 SQL (psql)
# - 신규 enum DROP
# - 신규 테이블 DROP (CASCADE)
# - AuditLog 추가 컬럼 DROP
# - 다른 모델의 추가 컬럼 DROP
```

---

## 4. 영향받는 파일

| 카테고리 | 파일 | 변경 |
|---------|------|------|
| 스키마 | `prisma/schema.prisma` | 패치 적용 완료 (5단계 fix) |
| 마이그레이션 | `prisma/migrations/20260607234000_a3_d4_phase0_entities/migration.sql` | 신규 (자동 적용) |
| 패치 스크립트 | `apply-schema-patch.js`, `apply-schema-patch-v2.js`, `fix-rest-patch.js`, `fix-enum-and-indexes.js`, `fix-user-auditlog.js`, `fix-kyc-relation.js`, `fix-user-kyc-relation.js` | schema.prisma 자동 패치 |
| 백업 | `prisma/schema.prisma.bak`, `.bak.a3v2`, `.bak.a3rest`, `.bak.a3enum` | 각 단계별 백업 |

---

## 5. 패치 적용 이력 (총 5단계)

| 단계 | 스크립트 | 변경 |
|------|----------|------|
| 1 | `apply-schema-patch-v2.js` | User 모델 확장 (8 relations) + AuditLog 확장 |
| 2 | `fix-rest-patch.js` | CoBuyPool, AuctionBid, PoolParticipant 확장 + 신규 모델 5개 |
| 3 | `fix-enum-and-indexes.js` | enum 10개 추가 + 인덱스 enum 필드 제거 |
| 4 | `fix-kyc-relation.js` | User 측 중복 FK 제거 (KycProfile.userId가 단일 FK) |
| 5 | `fix-user-kyc-relation.js` | User 측 kycProfile 단순 relation 추가 |

---

## 6. 후속 작업

- **A4**: detail_plan.docx Part 2, 3.1 코드 → Phase 3 PR용 정리
- **A5**: POOL_CREATION_MODEL_PROPOSAL.md v0.1 → v1.0 갱신
- **A6**: BUSINESS_FLOW.md §3 스키마 정의 일치 검증
- **A7**: detail_plan.docx Part 4~6 결정안 일치 검증
