# A2 마이그레이션 적용 가이드 (D-1 + D-6)

> **근거 문서**: [`docs/MASTER_RECONCILIATION.md`](../../../docs/MASTER_RECONCILIATION.md)
> **작업 일자**: 2026-06-07
> **상태**: 🟢 적용 대기
> **영향도**: Medium (모든 풀/견적 데이터)

---

## 0. TL;DR

본 마이그레이션은 다음 두 가지 정합성 차이를 해결합니다:

1. **D-1**: `PoolStatus` enum을 7-state에서 10-state로 통합
2. **D-6**: `Quote`/`CoBuyPool`의 Cargo 분류를 단순 String에서 2단계 FK 분류로 전환

기존 데이터는 모두 보존되며, `cargoType`은 하위 호환을 위해 nullable로 남습니다.

---

## 1. 적용 순서

### 1.1 사전 점검

```bash
# 현재 마이그레이션 상태 확인
npx prisma migrate status

# 현재 DB enum 값 분포 확인 (AUCTION, SHIPMENT_IN_PROGRESS가 있는지)
npx prisma db execute --stdin <<EOF
SELECT status, COUNT(*) FROM "CoBuyPool" GROUP BY status;
EOF
```

### 1.2 schema.prisma 수동 업데이트

`prisma/schema.prisma` 파일을 다음 내용으로 수정합니다. **자세한 patch는 `schema.patch.md` 참조.**

#### 1-1) PoolStatus enum 리네임 (라인 ~34-42)

```prisma
enum PoolStatus {
  DRAFT
  AGGREGATING
  AUCTION_LIVE        // ← AUCTION에서 리네임
  AWARDED
  CONTRACTED          // ← 신규
  IN_SHIPMENT         // ← SHIPMENT_IN_PROGRESS에서 리네임
  COMPLETED
  FAILED
  CANCELLED
  DISPUTED            // ← 신규
}
```

#### 1-2) HazmatClass enum 추가 (RateBenchmarkType 다음)

```prisma
enum HazmatClass {
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
```

#### 1-3) CargoCategory 모델 추가 (AuditLog 이전)

```prisma
model CargoCategory {
  code                String          @id
  nameKr              String
  nameEn              String
  isHazardous         Boolean         @default(false)
  defaultHazmatClass  HazmatClass?
  isReeferDefault     Boolean         @default(false)
  requiresSpecialDoc  Boolean         @default(false)
  requiredDocs        Json
  isActive            Boolean         @default(true)
  displayOrder        Int             @default(0)
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  subTypes            CargoSubType[]
  quotes              Quote[]
  pools               CoBuyPool[]

  @@index([isActive, displayOrder])
}
```

#### 1-4) CargoSubType 모델 추가 (CargoCategory 다음)

```prisma
model CargoSubType {
  id                    Int              @id @default(autoincrement())
  categoryCode          String
  subTypeCode           String
  nameKr                String
  nameEn                String
  hazardousClass        HazmatClass?
  unNumber              String?
  requiredDocuments     Json?
  recommendedContainers Json?
  isActive              Boolean          @default(true)
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  category              CargoCategory    @relation(fields: [categoryCode], references: [code], onDelete: Cascade)
  quotes                Quote[]
  pools                 CoBuyPool[]

  @@unique([categoryCode, subTypeCode])
  @@index([isActive])
}
```

#### 1-5) Quote 모델 확장

기존:
```prisma
model Quote {
  ...
  cargoType        String        // ← NOT NULL
  ...
}
```

변경:
```prisma
model Quote {
  ...
  cargoType          String?       // ← nullable로 변경
  cargoCategoryCode  String?       // ← 신규
  cargoSubTypeId     Int?          // ← 신규
  hsCode             String?       // ← 신규
  ...
  cargoCategory      CargoCategory? @relation(fields: [cargoCategoryCode], references: [code])
  cargoSubType       CargoSubType?  @relation(fields: [cargoSubTypeId], references: [id])
  ...
  @@index([serviceCode, status])
  @@index([cargoCategoryCode, polCode, podCode, targetEtd])  // ← 신규
}
```

#### 1-6) CoBuyPool 모델 확장

기존:
```prisma
model CoBuyPool {
  ...
  cargoType        String        // ← NOT NULL
  ...
}
```

변경:
```prisma
model CoBuyPool {
  ...
  cargoType          String?       // ← nullable로 변경
  cargoCategoryCode  String?       // ← 신규
  cargoSubTypeId     Int?          // ← 신규
  ...
  cargoCategory      CargoCategory? @relation(fields: [cargoCategoryCode], references: [code])
  cargoSubType       CargoSubType?  @relation(fields: [cargoSubTypeId], references: [id])
  ...
  @@index([serviceCode, status, auctionStartUtc, auctionEndUtc])
  @@index([cargoCategoryCode, polCode, podCode, targetEtd])  // ← 신규
}
```

### 1.3 마이그레이션 적용

```bash
# 방법 A: Prisma CLI 사용 (권장)
npx prisma migrate deploy

# 방법 B: psql 직접 실행
psql "$DATABASE_URL" -f prisma/migrations/20260607230000_a2_d1_d6_pool_cargo_reconciliation/migration.sql
```

### 1.4 사후 검증

```bash
# 1. Prisma 클라이언트 재생성
npx prisma generate

# 2. 스키마 검증
npx prisma validate

# 3. 데이터 확인
npx prisma db execute --stdin <<EOF
-- PoolStatus 분포 확인
SELECT status, COUNT(*) FROM "CoBuyPool" GROUP BY status;

-- CargoCategory 시드 확인 (13개여야 함)
SELECT COUNT(*) FROM "CargoCategory";

-- 백필 결과 확인
SELECT
  (SELECT COUNT(*) FROM "Quote" WHERE "cargoCategoryCode" IS NOT NULL) AS quote_with_category,
  (SELECT COUNT(*) FROM "Quote" WHERE "cargoCategoryCode" IS NULL) AS quote_without_category,
  (SELECT COUNT(*) FROM "CoBuyPool" WHERE "cargoCategoryCode" IS NOT NULL) AS pool_with_category,
  (SELECT COUNT(*) FROM "CoBuyPool" WHERE "cargoCategoryCode" IS NULL) AS pool_without_category;
EOF
```

### 1.5 애플리케이션 코드 점검

`src/` 하위 코드 중 다음 패턴을 검색하여 새 enum/필드명으로 업데이트:

```bash
# 기존 enum 값 검색
grep -rn "AUCTION'" src/                   # AUCTION → AUCTION_LIVE
grep -rn "SHIPMENT_IN_PROGRESS" src/       # SHIPMENT_IN_PROGRESS → IN_SHIPMENT
grep -rn "quote.cargoType" src/             # cargoType → cargoCategoryCode
grep -rn "pool.cargoType" src/
```

---

## 2. 롤백 절차

문제 발생 시:

```bash
# 1. Prisma 마이그레이션 롤백 마킹
npx prisma migrate resolve --rolled-back 20260607230000_a2_d1_d6_pool_cargo_reconciliation

# 2. 수동 롤백 SQL (psql 직접 실행)
# - 신규 enum/테이블/컬럼 DROP
# - 기존 enum 재생성
# - 데이터 복원 (백업에서)
```

**권장**: 적용 전 반드시 DB 백업 (`pg_dump`) 수행.

---

## 3. 영향받는 파일

| 카테고리 | 파일 | 변경 |
|---------|------|------|
| 스키마 | `prisma/schema.prisma` | 수동 패치 필요 |
| 마이그레이션 | `prisma/migrations/20260607230000_a2_d1_d6_pool_cargo_reconciliation/migration.sql` | 신규 (자동 적용) |
| 문서 | `docs/MASTER_RECONCILIATION.md` | A1 결정 반영 |
| 애플리케이션 | `src/**` (검색 후 패치) | enum/필드명 변경 |

---

## 4. 예상 작업 시간

- schema.prisma 수동 패치: 15분
- 마이그레이션 적용: 5분
- 사후 검증 + 코드 점검: 30분
- **총 약 1시간**

---

## 5. 체크리스트

- [ ] DB 백업 완료 (`pg_dump`)
- [ ] `prisma/schema.prisma` 수동 패치 완료
- [ ] `npx prisma validate` 통과
- [ ] `npx prisma migrate deploy` 성공
- [ ] `npx prisma generate` 성공
- [ ] PoolStatus 분포 검증 (AUCTION/SHIPMENT_IN_PROGRESS 0건, 신규 상태 정상)
- [ ] CargoCategory 13개 시드 검증
- [ ] Quote/CoBuyPool cargoCategoryCode 백필 결과 확인
- [ ] `src/` 코드 enum/필드명 점검 완료
- [ ] 테스트 실행 (있는 경우)

---

## 6. 후속 작업

- **A3**: Phase 0 신규 엔터티 (KycProfile, KycDocument, TrustScore, PoolExtension)
- **A4**: detail_plan.docx Part 2, 3.1 코드 → Phase 3 PR 이관
- **A5**: POOL_CREATION_MODEL_PROPOSAL.md v1.0 갱신
- **A6**: BUSINESS_FLOW.md §3 스키마 정의 일치 검증
- **A7**: detail_plan.docx Part 4~6 결정안 일치 검증
