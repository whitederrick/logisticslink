# LogisticsLink 마스터 정합성 통합 결정 문서

> **문서 성격**: 4개 문서/스키마의 불일치 항목을 한 곳에 모아 **단일 진실 공급원(SSOT)** 으로 통합하기 위한 결정 문서.
> **대상 독자**: 제품·운영·개발·재무·법무 전 부서.
> **작성일**: 2026-06-07.
> **상태**: 🟡 결정 대기 (각 차이점별 Owner 결정 필요).

---

## 0. TL;DR

> **detail_plan.docx, BUSINESS_FLOW.md v2.0, prisma/schema.prisma, POOL_CREATION_MODEL_PROPOSAL.md 4개 사이에 의미 있는 정합성 차이가 발견되었습니다.**
> 모든 차이점은 단일 방향으로 통일되어야 하며, 본 문서가 그 **결정안과 적용 순서**를 제시합니다.

---

## 1. 비교 대상

| # | 문서/스키마 | 성격 | 상태 |
|---|------------|------|------|
| **A** | `reference/detail_plan.docx` | 사용자 작성 상세 기획안 (Part 1~6) | 작성 완료, 코드/스키마 예시 포함 |
| **B** | `prisma/schema.prisma` | 현재 운영 중인 DB 스키마 | **현재 상태(Ground Truth)** |
| **C** | `docs/BUSINESS_FLOW.md` v2.0 | 비즈니스 룰 마스터 문서 | 작성 완료, 신규 엔터티 다수 정의 |
| **D** | `docs/POOL_CREATION_MODEL_PROPOSAL.md` | 풀 생성 모델 제안 (v0.1) | 이번 세션에서 신규 작성 |

---

## 2. 차이점 매트릭스

### 2.1 PoolStatus Enum (풀 상태 머신)

| 출처 | 정의된 상태 |
|------|------------|
| **A. detail_plan.docx** | `COLLECTING`, `AUCTION`, `AWARDED`, `FAILED`, `COMPLETED` (5개) |
| **B. 현재 스키마** | `AGGREGATING`, `AUCTION`, `AWARDED`, `FAILED`, `SHIPMENT_IN_PROGRESS`, `COMPLETED`, `CANCELLED` (7개) |
| **C. BUSINESS_FLOW.md v2.0** | `DRAFT`, `AGGREGATING`, `AUCTION_LIVE`, `AWARDED`, `CONTRACTED`, `IN_SHIPMENT`, `COMPLETED`, `FAILED`, `CANCELLED`, `DISPUTED` (10개) |
| **D. 제안서** | C 기준 (BUSINESS_FLOW.md 우선) |

### 2.2 ETD Window 구조

| 출처 | 구조 |
|------|------|
| **A. detail_plan.docx** | `targetEtdStart`, `targetEtdEnd` (window) |
| **B. 현재 스키마** | `targetEtd` (단일값) |
| **C. BUSINESS_FLOW.md v2.0** | `targetEtd` (단일값, 매칭 시 ±3일 윈도우 적용) |
| **D. 제안서** | Phase 1: 단일값 유지 / Phase 3+: window 추가 |

### 2.3 PoolParticipant Unique 제약

| 출처 | 제약 |
|------|------|
| **A. detail_plan.docx** | `@@unique([poolId, userId, quoteId])` (quote 포함) |
| **B. 현재 스키마** | `@@unique([poolId, userId])` (R3: 동일 풀 중복만 차단) |
| **C. BUSINESS_FLOW.md v2.0** | `@@unique([poolId, userId])` (R3) |
| **D. 제안서** | C 기준 (R3 유지) |

### 2.4 신규 엔터티 도입 상태

| 엔터티 | A. detail_plan | B. 스키마 | C. BUSINESS_FLOW | D. 제안서 |
|--------|---------------|----------|----------------|----------|
| `KycProfile` | ✅ 정의 | ❌ 미구현 | ✅ §3.1 | 🟡 Phase 1 |
| `KycDocument` | ❌ 없음 | ❌ 미구현 | ✅ §3.1 | 🟡 Phase 1 |
| `TrustScore` | ✅ 정의 | ❌ 미구현 | ✅ §3.1 | 🟡 Phase 1 |
| `Deposit` | ✅ 정의 | ❌ 미구현 | ✅ §3.1 | 🟡 Phase 1 |
| `Invoice` | ✅ 정의 | ❌ 미구현 | ✅ §3.1 | 🟡 Phase 3 |
| `PoolExtension` | ✅ 정의 | ❌ 미구현 | ✅ §3.1 | 🟡 Phase 1 |
| `CargoCategory` | ✅ 정의 (스키마) | ❌ 미구현 | ✅ §3.1 | 🟡 Phase 1 |
| `CargoSubType` | ❌ 없음 | ❌ 미구현 | ✅ §3.1 | 🟡 Phase 1 |
| `AuditLog` | ✅ 정의 | ✅ 구현 (단순) | ✅ §3.1 | 🟡 Phase 1 |
| `Notification` | ❌ 없음 | ✅ 구현 | ❌ 없음 | - |
| `FreightRateBenchmark` | ❌ 없음 | ✅ 구현 (정교) | ❌ 없음 | - |

### 2.5 운임 기준선 (Limit / Ceiling) 표현

| 출처 | 필드 |
|------|------|
| **A. detail_plan.docx** | `CoBuyPool.limitFreightUsd` (필드 직접 보유) |
| **B. 현재 스키마** | `CoBuyPool.scfiBaseRateUsd` + 별도 `FreightRateBenchmark` 테이블 (정교) |
| **C. BUSINESS_FLOW.md v2.0** | `floorPriceUsd` (옵션) + SCFI 기준선 별도 |
| **D. 제안서** | B의 `FreightRateBenchmark` 테이블 우선 (이미 구현됨) |

### 2.6 Quote의 Cargo 매핑

| 출처 | 필드 |
|------|------|
| **A. detail_plan.docx** | `Quote.cargoCode` (FK → `CargoCategory.code`) |
| **B. 현재 스키마** | `Quote.cargoType` (String, 단순) |
| **C. BUSINESS_FLOW.md v2.0** | `Quote.cargoCategoryCode` (FK → `CargoCategory.code`) + `Quote.cargoSubTypeCode` (FK → `CargoSubType`) |
| **D. 제안서** | C 기준 (FK + 2단계 분류) |

### 2.7 Pool 생성 권한

| 출처 | 정의 |
|------|------|
| **A. detail_plan.docx** | 시스템이 자동 생성 (`POST /api/quotes/cluster`) |
| **B. 현재 스키마** | `CoBuyPool.createdById` (FK User) — 화주가 생성 |
| **C. BUSINESS_FLOW.md v2.0** | 화주 + 운영자 생성 모두 허용 (R6) |
| **D. 제안서** | Phase 1: A/B, Phase 3+: 하이브리드 (A + 운영자) |

### 2.8 Pool Overlap Prevention 룰

| 출처 | 룰 |
|------|-----|
| **A. detail_plan.docx** | `etdWindowStart ≤ targetEtdEnd AND etdWindowEnd ≥ targetEtdStart` (window 기반) |
| **B. 현재 스키마** | 명시 룰 없음 (인덱스만 존재) |
| **C. BUSINESS_FLOW.md v2.0** | ETD 차이 ≤ 3일 (단일값 기준) |
| **D. 제안서** | R6 신규 제안 (window + 특수취급 flag 기반 Hard block) |

---

## 3. 차이점별 권장 결정안

### 결정 D-1: PoolStatus Enum (Owner: 제품/개발)

**권장안**: **B의 7-state + C의 확장(DRAFT, CONTRACTED, DISPUTED) 통합 = 10-state** 채택

```typescript
// 권장 통합안 (10개 상태)
enum PoolStatus {
  DRAFT                  // 작성 중 (R3 사용자 DRAFT 단계)
  AGGREGATING            // 참여 모집 중 (= detail_plan의 COLLECTING)
  AUCTION_LIVE           // 역경매 진행 중
  AWARDED                // 낙찰 완료
  CONTRACTED             // 부킹 생성 완료 (= detail_plan의 AWARDED 다음)
  IN_SHIPMENT            // 선적 진행 (= SHIPMENT_IN_PROGRESS)
  COMPLETED              // 정산 완료
  FAILED                 // 유찰
  CANCELLED              // 취소
  DISPUTED               // 분쟁
}
```

**근거**:
- detail_plan의 `COLLECTING`은 의미상 BUSINESS_FLOW의 `AGGREGATING`과 동일 → 명명 통일
- detail_plan의 `AWARDED` → BUSINESS_FLOW의 `CONTRACTED` (별도 상태로 분리)
- detail_plan에 없는 `DRAFT`, `DISPUTED`는 비즈니스 운영상 필수

**마이그레이션**: 현재 스키마의 `AUCTION` → `AUCTION_LIVE` 리네임, `SHIPMENT_IN_PROGRESS` → `IN_SHIPMENT` 리네임, `DRAFT/CONTRACTED/DISPUTED` 추가.

---

### 결정 D-2: ETD Window (Owner: 제품/개발)

**권장안**: **단기(B)는 단일값 유지 / 중기(C)부터 window 추가** — Phase별 점진 도입

| Phase | Quote.targetEtd | CoBuyPool.targetEtd | 비고 |
|-------|----------------|---------------------|------|
| **Phase 1 (출시)** | 단일값 | 단일값 | 현재 스키마 유지 |
| **Phase 3 (Needs 선언 도입)** | `targetEtdStart`, `targetEtdEnd` 추가 | `etdWindowStart`, `etdWindowEnd` 추가 | 양쪽 nullable (하위 호환) |
| **Phase 5+ (자동 클러스터링)** | window 강제 | window 강제 | 단일값은 deprecate |

**근거**:
- Phase 1에서 window 추가 시 `Quote.targetEtd` (단일값) → `targetEtdStart/End` (window) 마이그레이션이 필요
- R3, R6 룰은 window 기반으로 설계되어 있으므로, 하이브리드 모델(Needs 선언)을 도입하는 Phase 3과 함께 window 필드 추가가 자연스러움
- 단일값은 하위 호환을 위해 nullable로 보존

**detail_plan과의 차이**: detail_plan은 Phase 3 시점에 window를 도입하라고 명시. 본 결정안과 일치.

---

### 결정 D-3: PoolParticipant Unique 제약 (Owner: 제품)

**권장안**: **B/C/D 채택 (R3 유지) — `@@unique([poolId, userId])`**

```typescript
// 권장
@@unique([poolId, userId])
```

**근거**:
- detail_plan의 `@@unique([poolId, userId, quoteId])`는 quoteId 단위로 중복 차단을 추가한 것이지만, 이 경우 R3(동일 풀 내 중복만 차단)의도와 충돌
- 한 화주가 동일 풀에 여러 quote로 중복 참여 시도 가능 → quoteId까지 unique면 막히지 않아 의도와 일치할 수도 있으나
- 비즈니스 룰상 "한 화주 = 한 풀 단일 참여"가 R3의 핵심 의미이므로 `@@unique([poolId, userId])`가 더 명확
- quote별 가중치/세부 옵션이 필요하면 별도 컬럼(예: `role`='PRIMARY'/'SECONDARY')로 표현

**detail_plan과의 차이**: detail_plan 코드 예시(`@@unique([poolId, userId, quoteId])`)는 R3를 잘못 해석한 것으로 보이며, R3 원문은 "동일 풀 내 중복 참여는 불가"이므로 단순 `[poolId, userId]`가 맞음.

---

### 결정 D-4: 신규 엔터티 도입 순서 (Owner: 제품/개발)

**권장안**: **Phase별 점진 도입 (C 기준)**

| Phase | 추가 엔터티 | 우선순위 |
|-------|------------|---------|
| **Phase 0 (기반)** | `CargoCategory`, `KycProfile`, `KycDocument`, `TrustScore`, `PoolExtension`, `AuditLog` 확장 | 필수 |
| **Phase 1 (출시)** | `Deposit`, `CargoSubType`, `Notification` (이미 있음) | 필수 |
| **Phase 3 (정산)** | `Invoice`, `AccessorialCharge` | 필수 |
| **Phase 5+ (확장)** | `NeedRequest`, `PoolCandidate` (신규) | 선택 |

**근거**:
- detail_plan은 모든 엔터티를 한 번에 도입하려 하나, MVP 출시에는 과한 스코프
- BUSINESS_FLOW.md v2.0 §13.3의 Phase 로드맵(4주/6주/4주...)에 맞춘 점진 도입이 안전
- `AuditLog`는 현재 스키마에 단순 형태로 이미 존재 → 확장만 필요

**detail_plan과의 차이**: detail_plan은 통합 출시 가정, 본 결정안은 MVP 우선 + 점진 확장. **단, detail_plan의 Part 2, 3.1 클러스터링 API 코드는 Phase 3에서 재사용 가능.**

---

### 결정 D-5: 운임 기준선 표현 (Owner: 개발/재무)

**권장안**: **B의 FreightRateBenchmark 테이블 우선 (이미 구현됨)**

```typescript
// 현재 스키마 (B) 유지
model CoBuyPool {
  scfiBaseRateUsd Decimal  // 스냅샷 (경매 시작 시점)
}

model FreightRateBenchmark {
  source RateBenchmarkSource
  polCode String
  podCode String
  rateUsd Decimal
  // ... 여러 출처의 운임 데이터
}
```

**근거**:
- B의 `FreightRateBenchmark` 테이블은 SCFI/FBX/Drewry/Xeneta 등 다중 출처 통합 운임 인덱스로 설계되어 detail_plan의 단순 `limitFreightUsd`보다 정교
- `CoBuyPool.scfiBaseRateUsd`는 경매 시작 시점의 스냅샷으로 저장 (변동 추적 가능)
- detail_plan의 `limitFreightUsd`는 위 스냅샷의 별칭으로 보면 됨

**detail_plan과의 차이**: detail_plan은 `limitFreightUsd` 필드를 CoBuyPool에 직접 두는 단순 구조. 본 결정안은 FreightRateBenchmark 테이블 + 스냅샷 필드 조합으로 더 정교한 운임 관리.

---

### 결정 D-6: Quote의 Cargo 매핑 (Owner: 개발)

**권장안**: **C 채택 — `cargoCategoryCode` (FK) + `cargoSubTypeCode` (FK) 2단계 분류**

```typescript
// 권장 통합안
model Quote {
  cargoCategoryCode String           // FK → CargoCategory.code [R1-A]
  cargoSubTypeCode  String?          // FK → CargoSubType.id (nullable) [R1-B]
  cargoType         String?          // 하위 호환 (deprecated)
  hsCode            String?          // 통관용 (선택)
}

model CoBuyPool {
  cargoCategoryCode String           // FK → CargoCategory.code
  cargoSubTypeCode  String?          // FK → CargoSubType.id (nullable)
  cargoType         String?          // 하위 호환
}
```

**근거**:
- detail_plan은 `cargoCode`로 단일 분류, BUSINESS_FLOW는 2단계 분류 → 2단계 분류가 산업군 룰에 필수
- 현재 스키마의 `cargoType` (String)은 하위 호환을 위해 nullable로 보존
- 모든 마이그레이션은 `cargoType` 값 → `CargoCategory` 코드 매핑 스크립트로 일괄 처리

**detail_plan과의 차이**: detail_plan은 `cargoCode` (단일), 본 결정안은 `cargoCategoryCode` + `cargoSubTypeCode` (2단계).

---

### 결정 D-7: Pool 생성 권한 (Owner: 제품/운영)

**권장안**: **하이브리드 (A의 자동 + C의 수동 + D의 Phase별)**

| Phase | 모델 | 권한 |
|-------|------|------|
| **Phase 1** | 화주 명시적 풀 생성 (B) | 화주(VERIFIED+), 운영자 |
| **Phase 2** | (Phase 1과 동일) | 동일 |
| **Phase 3** | Needs 선언 + Auto-Clustering (A) 추가 | 화주가 needs 등록 → 시스템이 풀 후보 생성 → 운영자/화주 검증 |
| **Phase 4+** | 자동 모드 디폴트 | 운영자 정책에 따라 자동/수동 토글 |

**근거**:
- B는 `createdById`로 화주 추적 → R5 Trust Score 룰과 연결
- A는 자동 생성이므로 `createdById`가 null 또는 시스템 user
- 두 방식이 공존하기 위해 `createdById` nullable 유지

**detail_plan과의 차이**: detail_plan은 자동 생성만 가정, 본 결정안은 Phase 1은 수동 + Phase 3부터 자동 추가.

---

### 결정 D-8: Pool Overlap Prevention (Owner: 제품/운영)

**권장안**: **D의 R6 (window + flag 기반 Hard block) 채택 — 단, Phase별 window 유무에 따라 룰 조정**

| Phase | 룰 |
|-------|-----|
| **Phase 1 (window 없음)** | 동일 `cargoCategory + POL + POD + containerType + isHazardous + isReefer + isHeavy` 조합에서 `ABS(pool.targetEtd - quote.targetEtd) ≤ 3일`이면 신규 풀 생성 차단 |
| **Phase 3+ (window 도입)** | 동일 조합에서 `etdWindowStart ≤ targetEtdEnd AND etdWindowEnd ≥ targetEtdStart`이면 차단 |
| **모든 Phase** | 운영자 override 가능 (감사 로그 기록) |

**근거**:
- detail_plan의 룰은 window 기반이므로 Phase 3부터 적용 가능
- BUSINESS_FLOW.md의 ±3일 룰은 Phase 1의 현실적 룰
- D의 R6는 Phase별 분기 가능

---

## 4. 통합 적용 순서 (로드맵)

```
[즉시] 결정 D-1~D-8 문서 확정 (Owner 표시 후 승인)
   ↓
[1주] Phase 0: 스키마 마이그레이션 (CargoCategory, KycProfile, TrustScore, PoolExtension)
   ↓
[2주] Phase 1: enum 리네임 (AUCTION→AUCTION_LIVE, SHIPMENT_IN_PROGRESS→IN_SHIPMENT), DRAFT/CONTRACTED/DISPUTED 추가
   ↓
[3~6주] Phase 1: 풀 생성/매칭 API v2 구현 (R3, R6 룰 적용)
   ↓
[7~12주] Phase 1: 보증금/Trust Score 인프라 (Deposit, KYC 검증)
   ↓
[13~24주] Phase 3: Needs 선언 + Auto-Clustering (ETD window 필드 추가, NeedRequest 엔터티)
   ↓
[25~32주] Phase 3: Invoice 정산, 부대비용 분리
```

---

## 5. 액션 아이템 (Owner별)

| # | 결정 | Owner | 마감 | 상태 |
|---|------|-------|------|------|
| **A1** | D-1~D-8 결정안 승인 | 제품/개발 | 즉시 | 🟡 |
| **A2** | `prisma/schema.prisma` 마이그레이션 1차 (D-1, D-6) | 개발 | +1주 | 🟡 |
| **A3** | `prisma/schema.prisma` 마이그레이션 2차 (D-4 신규 엔터티 Phase 0) | 개발 | +2주 | 🟡 |
| **A4** | detail_plan.docx 코드 예시(Part 2, 3.1)를 Phase 3 구현 PR로 이관 | 개발 | Phase 3 시작 시 | 🟡 |
| **A5** | `POOL_CREATION_MODEL_PROPOSAL.md` v0.1 → v1.0 갱신 (D-1~D-8 반영) | 제품 | 결정 확정 후 | 🟡 |
| **A6** | `BUSINESS_FLOW.md` v2.0의 §3 스키마 정의가 마이그레이션 결과와 일치하는지 검증 | 개발 | +1주 | 🟡 |
| **A7** | detail_plan.docx의 Part 4, Part 5, Part 6이 결정안과 일치하는지 검증 | 운영/법무 | +2주 | 🟡 |

---

## 6. 부록: 4자 비교 전체 매트릭스 (요약)

| 차이점 카테고리 | A. detail_plan | B. 스키마 | C. BUSINESS_FLOW | D. 제안서 | 권장 결정 |
|---------------|---------------|----------|----------------|----------|----------|
| PoolStatus | 5-state | 7-state | 10-state | C 우선 | 10-state 통합 |
| ETD | window | 단일 | 단일 | Phase별 | Phase별 점진 |
| PoolParticipant unique | [pool,user,quote] | [pool,user] | [pool,user] | [pool,user] | [pool,user] (R3) |
| 신규 엔터티 | 모두 정의 | 미구현 | 모두 정의 | Phase별 | Phase별 점진 |
| 운임 기준선 | limitFreightUsd | Benchmark 테이블 | floorPrice | Benchmark 우선 | Benchmark 우선 |
| Cargo 매핑 | cargoCode (단일) | cargoType (String) | 2단계 FK | 2단계 FK | 2단계 FK |
| 풀 생성 | 자동 | 화주 수동 | 화주+운영자 | Phase별 | Phase별 |
| Overlap 룰 | window | 없음 | ±3일 | R6 window | Phase별 |

---

## 7. 변경 이력

| 버전 | 일자 | 변경 |
|------|------|------|
| v0.1 | 2026-06-07 | 초안 작성. 4개 문서/스키마의 정합성 차이 8개 카테고리 매트릭스 + 결정안 8개 + 로드맵 + 액션 아이템. |
