# 공동구매 풀(Group Buy Pool) 생성 모델 제안

> **문서 성격**: 사용자가 제시한 두 가지 풀 생성 방식(수동 vs 자동)에 대한 비교 분석 + **제3의 하이브리드 모델** 제안.
> **기반 문서**: `docs/BUSINESS_FLOW.md` v2.0 (Section 5: 풀 라이프사이클, Section 6: 매칭 알고리즘, Section 9.3: 보증금).
> **작성일**: 2026-06-07.
> **대상 독자**: 제품·운영·개발.

---

## 0. TL;DR

> **단기(Phase 1~2)는 "방식 A — 화주 명시적 풀 생성 + 운영자 권한"으로 출시하되, 중기(Phase 3~4)에 "Needs 선언 + 시스템 Auto-Clustering"으로 진화하는 하이브리드를 권장합니다.**
> 두 방식은 양자택일이 아니라 **시장 성숙도에 따라 단계적으로 전환**하는 것이 안전합니다.

---

## 1. 두 방식의 비교 분석

### 1.1 방식 A — 화주가 직접 풀 생성 (수동)

#### 동작
- 화주가 직접 `CoBuyPool`을 생성
- `targetEtd` (단일값) 또는 `etdWindowStart/End` 설정
- 동일 `cargoCategory + POL + POD + containerType + isHazardous + isReefer` 조합에서 출발일자 range가 겹치는 풀은 생성 차단

#### 장점
| # | 장점 | 비고 |
|---|------|------|
| A1 | **화주 인텐트가 명확** | "내가 이 시점에 이 물량을 보내고 싶다" |
| A2 | **책임 소재 명확** | 풀 생성자가 `createdByUserId`로 추적됨 |
| A3 | **구현 단순** | 비즈니스 룰 + 매칭 알고리즘 v2로 충분 |
| A4 | **콜드 스타트 시에도 동작** | 화주 1명이 풀 만들고 다른 화주 합류 대기 |
| A5 | **운영 부담 낮음** | 대부분 풀은 화주 자율 관리 |

#### 단점
| # | 단점 | 비고 |
|---|------|------|
| A6 | **range 중복 생성 시도 차단 필요** | "동일 needs가 두 풀에 분산" 방지 룰 필요 |
| A7 | **threshold 미달 풀 누적** | AUCTION_LIVE 진입 못 한 풀이 쌓임 → 운영자 부담 |
| A8 | **시장 비대칭** | "다른 화주도 같은 needs를 가졌을 것"이라는 정보가 화주에게 없음 |
| A9 | **range 설정의 모호성** | 화주가 너무 좁게 잡으면 다른 화주와 못 만남, 너무 넓게 잡으면 의미 ↓ |

---

### 1.2 방식 B — 시스템이 자동으로 풀 생성

#### 동작
- 화주는 `Quote`(견적) 등록 시 `etdWindowStart/End`만 설정
- 시스템이 주기적으로 같은 `cargoCategory + POL + POD + containerType + 특수취급 flag` 조합의 견적들을 클러스터링
- ETD window 교집합이 가장 큰 구간을 공동 ETD로 산정 → 풀 자동 생성
- 선사에 역경매 제안

#### 장점
| # | 장점 | 비고 |
|---|------|------|
| B1 | **시장 유동성 극대화** | 파편화된 needs를 자동 통합 |
| B2 | **운영자 개입 최소화** | threshold 미달 풀이 자연스럽게 묶임 |
| B3 | **시장 통계 기반** | "이 구간/물성에서 어떤 ETD가 가장 인기 있는지"가 데이터로 축적 |
| B4 | **콜드 스타트 완화** | 화주가 명시적으로 풀을 만들지 않아도 매칭됨 |

#### 단점
| # | 단점 | 비고 |
|---|------|------|
| B5 | **화주 인텐트 불명확** | "내 needs가 자동으로 묶였다"는 인식 → 통제력 상실감 |
| B6 | **클러스터링 알고리즘 복잡도** | cold start 시 클러스터 형성 실패, 희소 구간에서 풀 폭증 가능 |
| B7 | **법적/계약적 책임 소재 모호** | 풀 생성자가 누구인지? (시스템이면 화주 동의 인프라도 필요) |
| B8 | **opt-out 메커니즘 필수** | "나는 묶이기 싫다"는 화주도 항상 있어야 함 |
| B9 | **선사 응찰 동기 약화** | "자동 생성된 풀"은 화주의 강한 인텐트가 없어 부킹 확신 ↓ |

---

## 2. 제3의 제안: 하이브리드 Needs-Pool 모델

### 2.1 핵심 컨셉

> **화주는 풀(Pool)을 "만드는" 것이 아니라 needs를 "선언"한다. 시스템이 needs들을 자동 클러스터링하여 풀 후보를 만들고, 운영자/화주가 검증하여 정식 풀을 확정한다.**

이는 방식 A와 B의 **장점만 결합**한 모델입니다.

```
화주 needs 등록 (Quote + Window)
         ↓
  시스템 Auto-Clustering (주기적/이벤트 기반)
         ↓
  풀 후보(PENDING_REVIEW) 생성
         ↓
  운영자 + 화주 검증 (opt-out 가능)
         ↓
  정식 풀 확정 → 기존 풀 라이프사이클 진입
```

### 2.2 Phase별 로드맵

| Phase | 모델 | 핵심 변경 | 기대 효과 |
|-------|------|----------|----------|
| **Phase 1~2 (출시 ~ 3개월)** | **방식 A only** | 화주 명시적 풀 생성, range overlap 룰 | 빠른 시장 검증, 단순한 UX |
| **Phase 3~4 (4~6개월)** | **하이브리드 (A + Needs 선언)** | 화주가 풀 대신 `NeedRequest` 선언 가능, 시스템이 풀 후보 제시 | 시장 유동성 ↑, 화주 통제권 유지 |
| **Phase 5+ (7개월+)** | **풀 자율 진화** | needs/풀 양방향 자동 조정, 선사 수요 기반 역방향 클러스터링 | 풀 형성 시간 7일 → 3일 |

---

## 2.3 Phase 1~2 (출시): 방식 A 채택 시 상세 설계

#### R6: Pool Overlap Prevention Rule (신규)
```
동일 cargoCategory + cargoSubType + POL + POD + containerType + isHazardous + isReefer + isHeavy 조합에서:
  - 기존 AGGREGATING 풀의 [etdWindowStart, etdWindowEnd]와
  - 신규 풀의 [targetEtd - tolerance, targetEtd + tolerance]가
  - 하나라도 겹치면 생성 차단
  - 단, 운영자 override 가능
```

#### 풀 생성 권한
- **화주(VERIFIED+ KYC Tier)**: 풀 생성 가능, `createdByUserId` 기록
- **운영자(Admin)**: 모든 화주 대신 풀 생성 가능, 시장 curation 목적
- **화주(BASIC KYC)**: 풀 생성 불가, 기존 풀 참여만 가능 (R3 복수 참여 허용)

#### 풀 threshold (기존 §5.3 유지)
- `minVolumeTeu`: 4 TEU (배터리는 §11.1 강제)
- `minParticipants`: 2
- 미달 시: 자동 연장 (+7일) / 단독 견적 전환 / 운영자 폐기

---

## 2.4 Phase 3~4: 하이브리드 모델 상세 설계

### 신규 엔터티: `NeedRequest`

```typescript
interface NeedRequest {
  id: string
  userId: string                    // 화주
  status: 'OPEN' | 'CLUSTERED' | 'EXPIRED' | 'WITHDRAWN'
  
  // 매칭 키
  serviceCode: 'forwardlink-ocean'
  cargoCategoryCode: string
  cargoSubTypeCode?: string
  polCode: string
  podCode: string
  containerType: string
  isHazardous: boolean
  isReefer: boolean
  isHeavy: boolean
  
  // ETD window (핵심: 화주가 감내 가능한 범위)
  etdWindowStartUtc: DateTime
  etdWindowEndUtc: DateTime
  
  // 물량
  volumeTeu: number
  cbm?: number
  weightKg?: number
  
  // 기타
  incoterms?: string
  preferredCurrency?: string
  
  // 매칭 결과
  clusteredIntoPoolId?: string
  clusteringScore?: number
  
  createdAt: DateTime
  expiresAt: DateTime  // 14일 default
}
```

### Auto-Clustering 알고리즘 (주기적 + 이벤트 트리거)

```typescript
// 1. 동일 needs를 가진 그룹핑
const groups = groupBy(openNeeds, (n) => 
  `${n.cargoCategoryCode}|${n.cargoSubTypeCode}|${n.polCode}|${n.podCode}|${n.containerType}|${n.isHazardous}|${n.isReefer}|${n.isHeavy}`
)

// 2. 각 그룹에서 ETD window 교집합 분석
for (const [key, needs] of groups) {
  // 가능한 ETD 후보 (N² 교집합)
  const intersections = computePairwiseEtdIntersections(needs)
  // 3개 이상 needs의 window가 모두 겹치는 구간만 후보로
  const commonIntersections = findCommonRange(intersections, minRangeDays = 3)
  
  // 3. 후보 풀의 "공동 ETD" 선택
  for (const range of commonIntersections) {
    const candidateNeeds = needs.filter(n => n.etdWindowStartUtc <= range.end && n.etdWindowEndUtc >= range.start)
    const totalVolume = sum(candidateNeeds.map(n => n.volumeTeu))
    
    if (totalVolume >= poolMinVolume && candidateNeeds.length >= poolMinParticipants) {
      // 풀 후보 생성
      createPoolCandidate({
        needs: candidateNeeds,
        etdRange: range,
        score: totalVolume * candidateNeeds.length  // 우선순위 점수
      })
    }
  }
}

// 4. PENDING_REVIEW 풀 후보 알림
```

### 풀 후보(PoolCandidate) 검토

```
PENDING_REVIEW 상태:
  - 풀 후보로 제안된 needs 화주들에게 알림 발송
  - 운영자 대시보드에 표시
  
검토 옵션 (N=24h 이내):
  1) 자동 확정: 아무도 거부 안 하면 자동 정식 풀로 전환
  2) 화주 거부(opt-out): 1명이라도 거부 → 후보 풀에서 해당 needs 제외, 재평가
  3) 운영자 확정/취소: 운영자가 수동으로 결정
  
확정 후:
  - 정식 CoBuyPool 생성 (기존 §5 라이프사이클 진입)
  - 참여 needs는 PoolParticipant로 전환
  - createdByUserId = null (자동 클러스터링의 경우)
  - 운영자가 만든 경우 = 운영자 ID
```

### 운영자 Curation 도구
- 운영자는 시장 균형 위해 다음 권한 보유:
  - **풀 강제 분할**: 너무 큰 풀을 두 개로 분할 (예: 50 TEU → 25+25)
  - **풀 강제 병합**: 동일 구간/물성의 작은 풀 병합
  - **range 수동 조정**: 운영자가 ETD window를 조정하여 더 나은 클러스터 형성
  - **disabled window**: 특정 날짜 range를 풀 형성 금지 (예: 명절, 금요일 출항 회피)

---

## 3. 보증금(Deposit) 처리에 대한 의견

### 3.1 두 옵션의 비교

| 옵션 | 장점 | 단점 | 적합 시나리오 |
|------|------|------|--------------|
| **은행 에스크로** | 법적 안전성 ↑, 화주 신뢰 ↑, 무이자 예치 시 금융 수익 | 계약/세팅 3~6개월, 최소 보증금 한도, API 제한적 | 대형/장기 풀, KYC PREMIUM |
| **PG사 Virtual Account (토스/이니시스/아임포트)** | 즉시 발급, API 성숙, 정산 자동화 | 보증금 환불 분쟁 시 책임 소재 모호 가능 | 중소형/일반 풀 |
| **글로벌 PG (Stripe Connect / Mangopay)** | 다국적 결제, USD/EUR, 자동 환전 | 한국 화주는 onboarding 복잡, 수수료 ↑ | 해외 화주 풀 |
| **신용카드 Auth-Hold (Stripe Auth)** | 즉시 가용성 확인, 부킹 거절 시 자동 취소 | 한도 제한, 가맹점 계약 필요 | 선사 입찰 보증금 |

### 3.2 권장안: Hybrid (수단별 라우팅)

```
                 ┌──────────────────────┐
                 │  화주 위치/통화/규모  │
                 └──────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  ┌──────────┐         ┌──────────┐         ┌──────────┐
  │국내 KRW  │         │해외 USD  │         │선사      │
  │중소 규모 │         │대형 규모 │         │입찰 보증금│
  └────┬─────┘         └────┬─────┘         └────┬─────┘
       ▼                    ▼                    ▼
  제휴 은행            글로벌 에스크로       신용카드 Auth
  가상계좌             (Stripe/Mangopay)     (Stripe Auth)
  (NH/하나/우리)       USD/EUR 직접 보관
```

### 3.3 구조적 제안

#### a) 단일 에스크로 통합
- 한 가지 수단만 쓰지 않고, **화주의 위치·통화·규모에 따라 자동 라우팅**
- 플랫폼 내부에 "Deposit Account Ledger" 통합 관리 (수단별 차이는 추상화)

#### b) 예치금 분리 운용
- **보증금용 가상계좌** ≠ **운임 결제용 가상계좌** (회계·법적 클린)
- 인보이스 결제와 보증금은 별도 PG 가맹점으로 분리

#### c) 환전 리스크 흡수
- USD 보증금 → KRW 정산 시 **forward contract** 옵션 (중장기)
- 단기에는 FX Buffer 0.5% 흡수 (기존 §8.5 유지)

#### d) 화주 UX
- 화주가 결제 수단 선택 (가상계좌 / 카드 / 계좌이체)
- 입금 확인은 5분 이내 (실시간 noti)
- 보증금 환불은 정상 완료 후 7 영업일 (기존 §9.3 유지)

---

## 4. 최종 권장안

### 단기 (Phase 1~2) — 출시
- ✅ **방식 A (화주 명시적 풀 생성) + 운영자 권한** 채택
- ✅ R6 Pool Overlap Prevention 룰로 range 중복 방지
- ✅ 보증금은 **국내 가상계좌 + 글로벌 PG (Stripe)** 하이브리드
- ✅ 운영자 override 권한 유지 (R5, R6 모두)

### 중기 (Phase 3~4) — 4~6개월
- 🔄 `NeedRequest` 엔터티 도입, 화주가 풀 대신 needs 선언 가능
- 🔄 시스템 Auto-Clustering으로 풀 후보 자동 생성
- 🔄 운영자 + 화주 검증 후 정식 풀 확정
- 🔄 Phase 1의 명시적 풀 생성도 호환 유지 (화주 선택권)

### 장기 (Phase 5+) — 7개월+
- 🚀 풀 자율 진화: needs/풀 양방향 자동 조정
- 🚀 선사 수요 기반 역방향 클러스터링 (선사가 선호 구간/물성 제시 → 화주 needs 유도)
- 🚀 풀 형성 시간 단축 (7일 → 3일 목표)

---

## 5. 결정 필요한 사항 (Owner: 제품/운영)

| # | 결정 사항 | Owner | 비고 |
|---|----------|-------|------|
| D1 | Phase 1은 방식 A로 출시할 것인가? | 제품/운영 | 본 문서 권장 |
| D2 | R6 Pool Overlap Prevention 룰을 어떤 강도로 적용할 것인가? (Hard block vs Warning) | 운영 | Hard block 권장 |
| D3 | 운영자 override 권한 범위? (전체 풀 생성 / range 조정 / 풀 분할/병합) | 운영 | 본 문서 2.4 참조 |
| D4 | 보증금 PG는? (토스페이먼츠 / NH 가상계좌 / Stripe Connect) | 재무/법무 | 단기 결정 필요 |
| D5 | Auto-Clustering 자동 확정 모드의 디폴트 (자동 / 수동)? | 제품 | 자동 + 화주 opt-out 권장 |

---

## 6. 부록

### 6.1 풀 라이프사이클 매핑 (기존 §5와의 호환성)

```
Phase 1 (방식 A):
  화주 → [CoBuyPool 생성] → AGGREGATING → AUCTION_LIVE → AWARDED → ...

Phase 3 (하이브리드):
  화주 → [NeedRequest 등록]
            ↓
        [Auto-Clustering]
            ↓
        PoolCandidate (PENDING_REVIEW)
            ↓
        [검증: 자동/운영자/화주]
            ↓
        [CoBuyPool 생성] → AGGREGATING → AUCTION_LIVE → AWARDED → ...
```

기존 §5의 풀 라이프사이클(상태 머신, 임계치 룰, anti-sniping 등)은 **그대로 재사용**됩니다.
본 제안은 **풀 생성 직전 단계**만 추가하는 것이며, 풀 확정 이후의 모든 비즈니스 룰은 변하지 않습니다.

### 6.2 변경 이력

| 버전 | 일자 | 변경 |
|------|------|------|
| v0.1 | 2026-06-07 | 초안 작성. 두 방식 비교 + 하이브리드 모델 제안. |
