# LogisticsLink - 비즈니스 플로우 한눈에 보기

> **본 문서**: `docs/BUSINESS_FLOW.md` (v2.0)의 **요약 + 시각적 다이어그램** 모음.
> 의사결정자·신규 합류자·세일즈가 빠르게 이해하도록 작성.

---

## 1. 비즈니스 한 줄 요약

```
산업군·물성·구간별로 화주 수요를 묶고 → 블라인드 역경매로 선사/포워더에 낙찰
```

---

## 2. 핵심 5대 비즈니스 룰

```mermaid
flowchart LR
    A[화주 물량 등록] --> B{물성 분류}
    B -->|산업군 13종| C[공동구매 풀]
    C --> D[블라인드 역경매]
    D --> E[낙찰 + 정산]
    A -.복수 참여.-> C
    A -.KYC/Tier.-> F[신뢰 시스템]
    F -.보증금/Take Rate.-> E
```

| 룰 | 내용 |
|----|------|
| **R1. 물성 단위 분리** | 산업군·세부물성이 다른 화물은 절대 섞이지 않음 (배터리 ≠ 전자 ≠ 화학) |
| **R2. 블라인드 역경매** | 선사는 총량·구간·물성·스케줄만 보고 응찰, 화주 신원은 낙찰 후 공개 |
| **R3. 복수 참여** | 한 화주가 동일 산업군·구간의 ETD 다른 여러 풀에 동시 참여 가능 (단, 동일 풀 중복만 차단) |
| **R4. Take Rate** | 화주 2~4% + 선사 구독료·거래 수수료 + 부가서비스 + FX 스프레드 |
| **R5. KYC + Trust + 보증금** | 3단계 KYC + 이벤트 기반 Trust Score + 임계값별 보증금 차등 |

---

## 3. 산업군 분류 (R1)

13개 산업군 × 세부물성으로 2단계 분류:

```mermaid
mindmap
  root((CargoCategory<br/>13개))
    ELECTRONICS
      반도체
      디스플레이
      가전
    BATTERY ⚠️DG
      리튬이온셀
      배터리팩
    CHEMICAL ⚠️DG
      인화성
      부식성
      의약품
    AUTOMOTIVE
      엔진부품
      KD/CKD
    STEEL_METAL
    FOOD_AGRI 🧊
      냉장
      냉동
    TEXTILE
    COSMETICS
    FURNITURE
    INDUSTRIAL_MACHINERY
    LIFE_SCIENCE
    CONSUMER_GOODS
    OTHER
```

**산업군별 풀 격리 원칙**:
- ⚠️ 위험물 풀(`isHazardous=true`)은 비위험물 풀과 절대 합쳐지지 않음
- 🧊 냉장 vs 냉동은 별도 풀
- 같은 산업군이라도 세부물성이 다르면 별도 풀 (모수 부족 시 운영자 승인 하에 합병 가능)

---

## 4. 공동구매 풀 라이프사이클

```mermaid
stateDiagram-v2
    [*] --> DRAFT: 화주가 작성 시작
    DRAFT --> AGGREGATING: 생성 확정
    AGGREGATING --> AUCTION_LIVE: auctionStart 도달<br/>(minVolume/minParticipants 충족)
    AUCTION_LIVE --> AWARDED: 낙찰 성공
    AUCTION_LIVE --> FAILED: 입찰 없음
    AGGREGATING --> CANCELLED: 화주 전원 이탈
    AWARDED --> CONTRACTED: 부킹 생성
    CONTRACTED --> IN_SHIPMENT: ETD 도달
    IN_SHIPMENT --> COMPLETED: B/L 발행 + 정산 완료
    AWARDED --> DISPUTED: 분쟁 발생
    IN_SHIPMENT --> DISPUTED: 클레임
    DISPUTED --> COMPLETED: 해결
    DISPUTED --> CANCELLED: 합의 파기
    COMPLETED --> [*]
    FAILED --> [*]
    CANCELLED --> [*]
```

**풀 임계치 (Threshold)**:
- `minVolumeTeu`: 기본 4 TEU
- `minParticipants`: 기본 2사
- 미달 시: 자동 연장(+7일) / 단독 견적 전환 / 운영자 폐기

---

## 5. 사용자 여정 (User Journey)

### 5.1 화주

```mermaid
journey
    title 화주(Shipper) 여정
    section 가입·인증
      회원가입: 3: 화주
      KYC BASIC 제출: 4: 화주
      KYC 승인: 5: 운영자
    section 견적
      견적 요청 작성: 5: 화주
      산업군 선택: 5: 화주
      추천 풀 조회: 4: 시스템
    section 풀 참여
      기존 풀 참여 또는 신규 생성: 4: 화주
      추가 ETD 풀 동시 참여: 4: 화주
    section 경매·낙찰
      경매 시작 알림: 3: 시스템
      낙찰 알림: 5: 시스템
    section 정산
      인보이스 확인: 4: 화주
      결제: 3: 화주
      컨테이너 반입: 4: 화주
      B/L 수령: 5: 화주
      정산 완료: 5: 시스템
```

### 5.2 선사

```mermaid
journey
    title 선사(Carrier) 여정
    section 가입·인증
      회원가입: 3: 선사
      KYC + SCAC 등록: 4: 선사
      KYC 승인 (DG 적재 자격 포함): 5: 운영자
    section 운임표
      운임표 등록: 4: 선사
      (자동 API 연동 옵션): 3: 시스템
    section 경매
      AUCTION 풀 모니터링: 4: 선사
      입찰: 4: 선사
      재입찰: 4: 선사
    section 낙찰·부킹
      낙찰 알림: 5: 시스템
      부킹 생성: 4: 선사
    section 선적
      컨테이너 CY 반입: 4: 화주
      선적: 4: 선사
      B/L 발행: 4: 선사
    section 정산
      인보이스 확인: 3: 선사
      플랫폼 수수료 차감: 3: 시스템
      운임 수령: 5: 선사
```

---

## 6. 매칭 알고리즘

```mermaid
flowchart TD
    Start[화주 견적 요청] --> A[1차 Hard Filter]
    A --> B{13개 조건<br/>모두 만족?}
    B -->|No| X[매칭 없음<br/>신규 풀 생성 권장]
    B -->|Yes| C[2차 Scoring]
    C --> D{score >= 85?}
    D -->|Yes| E[강력 추천]
    D -->|70~84| F[추천]
    D -->|< 70| X
    E --> G[화주 선택]
    F --> G
    G --> H{기존 풀 참여?}
    H -->|Yes| I[PoolParticipant 생성<br/>R3: 동일 풀 중복만 차단]
    H -->|No| J[신규 풀 생성]
```

**1차 필터 (Hard)**:
- `cargoCategory` 일치 (R1-A)
- POL/POD 일치
- ETD 차이 ≤ 3일
- `isHazardous/isReefer/isHeavy` 일치
- `containerType` 일치

**2차 스코어 (Soft)**:
- 구간 일치 30점
- ETD 차이 (0일 20점 ~ 3일 5점)
- 세부물성 일치 15점
- 컨테이너 일치 10점
- 물량 효율 10점
- Trust Score 90+ 5점
- KYC VERIFIED 5점

---

## 7. 역경매 메커니즘

```mermaid
sequenceDiagram
    participant S1 as 선사 A
    participant S2 as 선사 B
    participant S3 as 선사 C
    participant P as 플랫폼
    
    Note over P: AUCTION_LIVE 시작
    S1->>P: 입찰 $3,200
    P->>S1: 현재 최저가: $3,200
    S2->>P: 입찰 $3,000
    P->>S1: 최저가 갱신 알림
    S1->>P: 재입찰 $2,950
    P->>S2: 최저가 갱신 알림
    Note over S2,S3: anti-sniping: 5분 남음<br/>신규 입찰 시 5분 연장
    S3->>P: 입찰 $2,900 (D-5min)
    P->>P: auctionEndUtc +5min
    P-->>S3: 확정 (낙찰 선사)
    S2->>P: 입찰 $2,850 (D-5min)
    P->>P: 다시 +5min
    S1->>P: 입찰 $2,800
    Note over P: auctionEndUtc 도달
    P->>S1: 🏆 낙찰 알림
    P->>S2: 유찰 알림
    P->>S3: 유찰 알림
```

**Anti-Sniping 룰**:
- 종료 5분 전 신규 입찰 발생 시 `auctionEndUtc`를 +5분 연장
- `extensionCount` 증가 (최대 3회)
- `PoolExtension` 테이블에 로그 기록

---

## 8. 수익 모델 (R4) 시각화

```mermaid
flowchart LR
    subgraph 화주_수익
        A1[낙찰 운임] --> A2[platformFee<br/>2~4%]
        A2 --> A3[플랫폼 매출]
    end
    
    subgraph 선사_수익
        B1[월 구독료] --> B3[플랫폼 매출]
        B2[거래 수수료 1%] --> B3
    end
    
    subgraph 부가수익
        C1[HS Code 분류] --> C3
        C2[MSDS 검증] --> C3
        C4[통관 대행] --> C3
        C5[FX 스프레드 0.3%] --> C3
        C6[예치금 운용] --> C3
    end
```

**Take Rate 티어 구조**:

| 화주 KYC | takeRateBps | 실수익률 |
|----------|-------------|----------|
| BASIC | 400 | 4.0% |
| VERIFIED | 300 | 3.0% |
| PREMIUM | 200 | 2.0% |

| 선사 플랜 | 월 구독료 | 거래 수수료 |
|----------|----------|------------|
| Standard | ₩300,000 | 1.0% |
| Premium | ₩1,500,000 | 1.0% (우선 매칭) |
| Enterprise | 별도 계약 | 별도 |

---

## 9. Trust Score 시스템

```mermaid
graph LR
    subgraph 화주_이벤트
        S1[정상 완료<br/>+5]
        S2[노쇼 취소<br/>-15]
        S3[결제 지연<br/>-3~-10]
        S4[분쟁 패소<br/>-20]
        S5[KYC 갱신<br/>+2]
    end
    
    subgraph 선사_이벤트
        C1[정상 부킹<br/>+5]
        C2[입찰 후 노쇼<br/>-25]
        C3[클레임 정당<br/>-15]
        C4[운임표 미갱신<br/>-5/wk]
    end
    
    S1 & S2 & S3 & S4 & S5 --> TS[Trust Score<br/>0~150]
    C1 & C2 & C3 & C4 --> TS
    TS --> T{임계값}
    T -->|90+| A1[보증금 면제]
    T -->|70~89| A2[1.0x]
    T -->|50~69| A3[VERIFIED 풀만<br/>1.5x]
    T -->|30~49| A4[BASIC 풀만<br/>2.0x]
    T -->|< 30| A5[참여 차단]
```

---

## 10. 정산 흐름 (D+N 타임라인)

```mermaid
gantt
    title 정산·송금 타임라인
    dateFormat  YYYY-MM-DD
    axisFormat %m/%d
    
    section 선적
    ETD (선적일)           :milestone, m1, 2026-07-01, 0d
    B/L Draft              :active, 2026-07-01, 1d
    B/L 원본               :2026-07-04, 1d
    
    section 화주 정산
    인보이스 발행           :milestone, m2, 2026-07-15, 0d
    화주 결제 윈도우         :2026-07-15, 7d
    
    section 선사 송금
    1차 송금 (95%)         :milestone, m3, 2026-07-22, 0d
    클레임 윈도우           :2026-07-22, 30d
    holdback 송금 (5%)     :milestone, m4, 2026-08-21, 0d
```

**인보이스 구성** (확장):
```
[1] Base Freight         (낙찰 운임)
[2] THC                  (터미널)
[3] BAF                  (연료할증)
[4] CAF                  (환율할증)
[5] Doc Fee              (서류)
[6] Insurance            (보험)
[7] Platform Fee         ← R4: takeRateBps
[8] VAT                  ([1]~[7]의 10%)
─────────────────────
Subtotal (USD) → FX → Total (KRW)
```

---

## 11. 산업군별 특화 룰 요약

| 산업군 | 강제 컨테이너 | 위험물 | 특화 서류 | 추가 takeRate |
|--------|--------------|--------|----------|---------------|
| **BATTERY** | DANGEROUS | Class 9 | MSDS, UN38.3 | +50 bps |
| **CHEMICAL** | TANKER | Class 3/6/8 | MSDS, REACH | +50 bps |
| **FOOD_AGRI** | REEFER 강제 | - | 위생증, 검역증 | - |
| **ELECTRONICS** | DRY | - | RoHS, KC | - |
| **AUTOMOTIVE** | DRY/HC | - | 원산지증명 | - |
| **STEEL_METAL** | DRY/HC (heavy) | - | - | - |
| **TEXTILE** | DRY | - | 원산지증명 | - |
| **LIFE_SCIENCE** | DRY/REEFER | - | 의약품 수출허가 | - |

---

## 12. 기존 MVP → v2.0 핵심 차이

| 영역 | MVP (v1) | Business v2.0 |
|------|----------|---------------|
| **물성 분류** | `cargoType` (단순 String) | `cargoCategory` 13종 + `cargoSubType` |
| **매칭 키** | cargoType + container | cargoCategory + 구간 + ETD + 특수취급 |
| **복수 참여** | 사실상 가능 | **명문화 + UI 분리** |
| **화주 인증** | 단순 ACTIVE | **KYC Tier 3단계** |
| **신뢰** | score 1컬럼 | **이벤트 로그 + 임계값 룰** |
| **수익** | 미정 | **Take Rate + 구독료 + 부가서비스** |
| **정산** | 미구현 | **Invoice + 부대비용 + FX Buffer** |
| **경매** | 공개 하락 고정 | **3가지 포맷 + Anti-Sniping** |
| **임계치** | 없음 | **minParticipants/minVolumeTeu** |
| **산업군 룰** | 없음 | **배터리·화학·식품·전자 특화** |

---

## 13. KPI 대시보드 (Top 5)

```mermaid
graph TD
    A[North Star<br/>화주 1인당 월 평균 TEU] --> B[수요 KPI]
    A --> C[공급 KPI]
    A --> D[매칭 KPI]
    A --> E[금융 KPI]
    
    B --> B1[활성 화주 수]
    B --> B2[견적→풀 전환율 70%]
    
    C --> C1[등록 선사 수]
    C --> C2[입찰 응찰률 60%]
    
    D --> D1[풀 형성 기간 7일]
    D --> D2[평균 낙찰가 = 기준가 75%]
    
    E --> E1[화주 AR 회수 14일]
    E --> E2[보증금 몰수율 < 5%]
```

| KPI | 1년 차 목표 |
|-----|-----------|
| 활성 화주 수 | 500사 |
| 등록 선사 수 | 30사 |
| 월 낙찰 풀 수 | 100건 |
| 평균 낙찰 할인율 | 25% (낙찰가 = 기준가의 75%) |
| 화주 NPS | 50+ |
| 월 매출 (takeRate 기준) | ₩50M+ |

---

## 14. 다음 단계

상세 비즈니스 룰, 도메인 모델, API 명세는 모두 [`docs/BUSINESS_FLOW.md`](./BUSINESS_FLOW.md) 참조.

본 요약 문서를 보고 다음 중 선택해 주세요:

1. **데이터베이스 스키마 마이그레이션** — `prisma/schema.prisma`에 신규 엔터티 추가
2. **API v2 설계** — 새로운 엔드포인트 명세 작성
3. **화주 UI 프로토타입** — 산업군 선택 → 풀 추천 → 복수 참여 UX
4. **KYC 워크플로우** — KycProfile + 문서 업로드 + Admin 검토 화면
5. **정산 엔진** — Invoice 생성 + 부대비용 배부 로직
6. **다른 룰 검토** — R1~R5 외에 추가/수정할 룰이 있다면 논의

---
