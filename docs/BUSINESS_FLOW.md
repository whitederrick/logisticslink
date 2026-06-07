# LogisticsLink - 비즈니스 플로우 마스터 문서 (v2.0)

> **문서 성격**: 본 문서는 기존 MVP PRD(`ForwardLink_Development_PRD.md`)를 **실제 운영 가능한 비즈니스 플랫폼** 관점으로 재설계한 **기준 문서**다.
> 모든 도메인 모델, API, UI, 운영 정책은 본 문서를 따른다.
>
> **문서 버전**: v2.0
> **최종 갱신**: 2026-06-07
> **대상 독자**: 제품·운영·개발·세일즈 전 부서
> **하위 호환**: 기존 `forwardlink-ocean` MVP와 데이터 호환을 유지하되, 물성 분류·복수 참여·수익 모델은 본 문서 기준으로 진화한다.

---

## 0. Executive Summary

### 0.1 비즈니스 한 줄 정의

**LogisticsLink는 산업군·물성·구간별로 화주의 파편화된 운송 수요를 공동구매 풀(Group Buy Pool)로 묶고, 사전 자격을 갖춘 선사와 포워더에게 블라인드 역경매로 낙찰하는 B2B 물류 마켓플레이스다.**

### 0.2 왜 MVP가 아닌 비즈니스 모델이 필요한가

기존 MVP는 "공동구매 + 역경매가 작동한다"는 것을 증명하는 데는 성공했다. 하지만 실제 화주·선사·포워더가 돈을 쓰고 법인 계약을 체결하려면 다음이 결정되어야 한다.

1. **수익이 어디서 발생하는가** (Take Rate 구조)
2. **누가 어떤 자격으로 참여하는가** (KYC, Trust Score, 보증금)
3. **물성·산업군을 어떻게 분리·매칭하는가** (Cargo Category Taxonomy)
4. **한 화주가 동일 물성의 여러 공동구매에 동시에 참여할 수 있는가** (Multi-Participation Rule)
5. **낙찰 이후 누가 무엇을 책임지는가** (정산, 부대비용, 클레임, 보험)
6. **법적·세무적 책임 소재** (인보이스, 세금계산서, 환차 손익)

본 문서는 위 6개 결정과 그에 따른 운영 규칙을 확정한다.

### 0.3 핵심 비즈니스 룰 5가지

| # | 룰 | 요약 |
|---|----|------|
| R1 | **물성(Cargo Category) 단위 분리** | 산업군·세부 물성이 다른 화물은 절대 같은 풀에 섞이지 않는다. |
| R2 | **블라인드 역경매** | 선사는 총량·구간·물성·스케줄만 보고 입찰하며, 참여 화주의 신원은 낙찰 후에만 공개된다. |
| R3 | **복수 참여 허용** | 한 화주는 동일 물성·구간이라도 ETD가 다른 여러 풀에 동시에 참여 가능하다. 단, 동일 풀 내 중복 참여는 불가. |
| R4 | **중개 수수료(Take Rate) 수익 모델** | 화주는 낙찰가 대비 플랫폼 수수료(%), 선사는 월 구독료 + 거래 수수료를 납부한다. |
| R5 | **KYC + Trust Score + 보증금** | 모든 참여자는 KYC를 통과해야 하며, Trust Score에 따라 보증금·참여 한도가 결정된다. |

---

## 1. 시장 정의와 페르소나

### 1.1 타겟 시장

| 세그먼트 | 예시 | 페인 포인트 |
|---------|------|------------|
| 중소형 산업 화주 | 자동차 부품, 전자, 화학, 배터리, 식음료 제조 중소기업 | 단독으로는 충분한 물량이 안 돼 운임 협상력이 약하다. |
| 글로벌 진출 중인 D2C/이커머스 | K-뷰티, K-푸드, 라이브커머스 셀러 | LCL 단위로도 단가가 비싸고, 스케줄 변경에 취약하다. |
| 1.5·2차 포워더 | 중소 포워더, NVOCC | 대형 선사와의 직접 계약이 어렵고, FAK 운임마저 협상력이 약하다. |
| NVOCC·디지털 포워더 | 디지털 1세대 포워더 | 화주 물량을 안정적으로 묶어 선사 단가를 끌어내릴 도구가 필요하다. |

### 1.2 페르소나

#### 1.2.1 Persona A: 김 대표 (중소 전자 부품 화주)

- 회사 규모: 매출 50억, 직원 20명
- 수출 패턴: 월 4~6 TEU, 부산 → LA / Long Beach
- 페인: 포워더 3곳에서 견적 받아도 40FT 단가가 $3,200~$3,800 사이에서 요동침
- 원하는 것: "내가 $2,800에 부킹할 수 있는 방법"

#### 1.2.2 Persona B: 배터리 셀 스타트업 물류팀장

- 회사 규모: 매출 200억, 직군 5명
- 수출 패턴: 월 10~15 TEU, 위험물 클래스 9 (리튬 배터리)
- 페인: 위험물 취급 가능 선사가 한정돼 단가 협상력이 더 떨어짐
- 원하는 것: "위험물 특화 풀에서 다른 배터리 화주와 묶여서 더 좋은 단가"

#### 1.2.3 Persona C: 부산 지역 포워더 영업이사

- 회사 규모: 매출 100억
- 취급 물량: 월 200 TEU, 다양한 화주 물량을 취합해 선사에 부킹
- 페인: 대형 선사 1사 FA 계약이 만료되면 단가가 바로 15% 이상 올라감
- 원하는 것: "스팟 수요를 모아 단가 협상력 회복"

#### 1.2.4 Persona D: 한진·현대 직속 선사 영업

- 권역: 부산발 북미/동남아
- 페인: 화주 직거래 견적 RFQ가 늘어나면서 B2B 포워더 단가 경쟁이 격화
- 원하는 것: "확정 수요가 있는 풀에 역경매로 응찰해 효율적으로 점유율 확보"

---

## 2. 산업군·물성 분류 체계 (Cargo Category Taxonomy)

### 2.1 왜 단순 `cargoType`으로는 부족한가

기존 MVP의 `cargoType`은 컨테이너 모드(FCL_DRY, LCL_GENERAL) 정도만 구분했다. 실제 비즈니스에서는 **산업군별로 다음이 다르다**.

- **컨테이너 권장 타입** (배터리는 위험물 클래스, 화학은 탱커)
- **HS Code 관세율** (배터리 vs 전자부품 vs 화학물질)
- **선사 라우트 가용성** (위험물 적재 가능 선사 한정)
- **보험료율** (위험물은海上보험료 3~5배)
- **법적 제약** (제재 품목, 수출통제)
- **현지 통관 복잡도** (배터리는 MSDS, 화학은 MSDS + 인증서)

따라서 **2단계 분류 체계**로 진화한다.

```
[CargoCategory: 산업군] 1개
   └── [CargoSubType: 세부 물성] N개
            └── [HS Code] N개 (선택)
```

### 2.2 CargoCategory (산업군) 마스터

| 코드 | 국문 | 영문 | 비고 |
|------|------|------|------|
| `ELECTRONICS` | 전기/전자 | Electronics | 반도체, 디스플레이, 가전 포함 |
| `BATTERY` | 배터리/2차전지 | Battery / Secondary Cell | 위험물 Class 9 (UN3480/3481) |
| `CHEMICAL` | 화학/제약 | Chemical / Pharmaceutical | 위험물 Class 3/6/8 포함 |
| `AUTOMOTIVE` | 자동차 부품 | Automotive Parts | KD/CKD 포함 |
| `STEEL_METAL` | 철강/금속 | Steel / Metal | 중량 화물 多 |
| `FOOD_AGRI` | 식음료/농산물 | Food / Agriculture | 냉장·냉동 多 |
| `TEXTILE_APPAREL` | 섬유/의류 | Textile / Apparel | LCL 多 |
| `COSMETICS` | 화장품/뷰티 | Cosmetics / Beauty | K-뷰티 |
| `FURNITURE` | 가구/인테리어 | Furniture / Interior | LCL 多 |
| `INDUSTRIAL_MACHINERY` | 산업기계/설비 | Industrial Machinery | 중량·중대형 화물 |
| `LIFE_SCIENCE` | 바이오/의료 | Life Science / Medical | 의약품, 의료기기 |
| `CONSUMER_GOODS` | 소비재/기타 | Consumer Goods | 잡화, 완구, 문구 등 |
| `OTHER` | 기타 | Other | 분류 미정 |

### 2.3 CargoSubType (세부 물성) 예시

```typescript
// 예시
{
  categoryCode: "BATTERY",
  subTypeCode: "LI_ION_CELL",
  subTypeNameKr: "리튬이온 셀",
  hazardousClass: "9",
  unNumber: "UN3480",
  requiredDocuments: ["MSDS", "UN38.3", "항공/해상 시험성적서"],
  recommendedContainer: ["20FT_DANGEROUS", "40FT_DANGEROUS"]
}
```

### 2.4 풀 매칭 시 적용 룰

- **R1-A**: 화주의 견적 `cargoCategory`와 풀의 `cargoCategory`가 **반드시 일치**해야 매칭 후보가 된다.
- **R1-B**: 같은 산업군이라도 `cargoSubType`이 다르면 별도 풀을 형성한다. (단, 모수가 부족할 경우 운영자 승인 하에 합쳐 운임)
- **R1-C**: 위험물/냉장/중량 플래그는 항상 보존되며, **`isHazardous=true`인 풀과 `false`인 풀은 절대 합쳐지지 않는다.**
- **R1-D**: HS Code는 매칭에 사용하지 않으며, 통관·보험 단계에서만 활용한다.

---

## 3. 새로운 도메인 모델

기존 스키마에 다음 엔터티를 추가/확장한다.

### 3.1 신규 엔터티

#### `CargoCategory` (산업군 마스터)
- `code` (PK): `BATTERY`, `ELECTRONICS` 등
- `nameKr`, `nameEn`
- `defaultHazmatClass`: 기본 위험물 등급 (없으면 null)
- `requiresSpecialDoc`: true/false
- `isActive`
- `displayOrder`

#### `CargoSubType` (세부 물성 마스터)
- `id` (PK)
- `categoryCode` (FK → CargoCategory.code)
- `subTypeCode`: 카테고리 내 유니크 코드
- `nameKr`, `nameEn`
- `hazardousClass`: UN 위험물 등급
- `unNumber`: UN 번호 (배터리, 화학)
- `requiredDocuments`: 필수 서류 목록 (JSON)
- `recommendedContainers`: 권장 컨테이너 타입 (JSON array)

#### `KycProfile` (기업 KYC 프로파일)
- `id` (PK)
- `userId` (FK)
- `legalNameKr`, `legalNameEn`
- `businessRegistrationNo`
- `corporateRegistrationNo`
- `taxId`
- `ceoName`
- `establishedYear`
- `annualRevenueKrw`
- `employeeCount`
- `industryCategoryCode` (FK → CargoCategory.code, 주력 산업군)
- `exportLicenseNo` (수출입업 등록번호)
- `customsBrokerLicenseNo` (관세사 자격, 선택)
- `kycStatus`: `PENDING` / `IN_REVIEW` / `APPROVED` / `REJECTED` / `EXPIRED`
- `kycTier`: `BASIC` / `VERIFIED` / `PREMIUM`
- `verifiedAt`
- `verifiedBy` (Admin ID)
- `expiresAt` (연 1회 갱신)
- `documents`: KYC 문서 업로드 메타데이터 (별도 테이블)

#### `KycDocument` (KYC 문서)
- `id` (PK)
- `kycProfileId` (FK)
- `documentType`: `BUSINESS_REGISTRATION` / `EXPORT_LICENSE` / `TAX_CERTIFICATE` / `BANK_STATEMENT` / `CEO_ID` / `INSURANCE_CERT`
- `fileUrl` (S3 등)
- `fileName`, `fileSize`, `mimeType`
- `uploadedAt`
- `reviewedAt`, `reviewedBy`, `reviewStatus`, `reviewNote`

#### `TrustScore` (신용 점수 이벤트)
- `id` (PK)
- `userId` (FK)
- `eventType`: `POOL_JOIN_SUCCESS` / `POOL_COMPLETED_ON_TIME` / `BID_NO_SHOW` / `PAYMENT_DELAY` / `KYC_RENEWED` / `DISPUTE_LOST` / `ADMIN_ADJUST`
- `scoreDelta` (±)
- `reason` (사람이 읽을 수 있는 설명)
- `relatedEntityType`, `relatedEntityId`
- `createdAt`
- `effectiveScore` (적용 후 점수 스냅샷, 디버깅용)

#### `Deposit` (보증금/예치금)
- `id` (PK)
- `userId` (FK)
- `poolId` (FK, nullable) — 풀 단위 보증금일 경우
- `quoteId` (FK, nullable) — 견적 단위 보증금일 경우
- `amountKrw`, `amountUsd`
- `currency`: `KRW` / `USD`
- `purpose`: `POOL_DEPOSIT` / `BID_DEPOSIT` / `PENALTY_HOLD`
- `status`: `PENDING_PAYMENT` / `HELD` / `REFUNDED` / `FORFEITED` / `APPLIED_TO_INVOICE`
- `paymentMethod`: `BANK_TRANSFER` / `CARD` / `VIRTUAL_ACCOUNT`
- `paidAt`
- `refundedAt`
- `externalRef` (PG사 거래번호)

#### `Invoice` (인보이스/세금계산서)
- `id` (PK)
- `poolId` (FK)
- `participantId` (FK)
- `shipperUserId` (FK)
- `carrierUserId` (FK)
- `baseFreightUsd` (낙찰 운임 × 비율)
- `localChargesUsd`
- `fuelSurchargeUsd` (BAF)
- `currencySurchargeUsd` (CAF)
- `thcUsd` (Terminal Handling Charge)
- `docFeeUsd`
- `platformFeeUsd` ← **R4: Take Rate 핵심**
- `platformFeeRate` (% 저장)
- `insuranceFeeUsd`
- `taxVatUsd`
- `totalBillingUsd`
- `billingCurrency`: `USD` / `KRW` / `EUR` 등
- `fxRateAtBilling`
- `fxBufferRate`
- `status`: `DRAFT` / `ISSUED` / `PARTIALLY_PAID` / `PAID` / `OVERDUE` / `CANCELLED` / `DISPUTED`
- `issuedAt`, `dueAt`, `paidAt`
- `taxInvoiceNo` (세금계산서 번호, 한국)

#### `PoolExtension` (Anti-Sniping 연장 로그)
- `id` (PK)
- `poolId` (FK)
- `triggeredAt`
- `triggeredByBidId` (FK → AuctionBid.id)
- `previousEndUtc`
- `newEndUtc`
- `extensionMinutes`

### 3.2 확장되는 기존 엔터티

#### `CoBuyPool` 확장
- `cargoCategoryCode` (FK → CargoCategory.code) ← **R1 핵심**
- `cargoSubTypeCode` (FK → CargoSubType, nullable)
- `minParticipants` (예: 2)
- `minVolumeTeu` (예: 4)
- `maxVolumeTeu` (예: 100)
- `currentParticipants` (derived)
- `currentVolumeTeu` (derived)
- `extensionCount` (0~3)
- `maxExtensionCount` (default 3)
- `auctionFormat`: `DESCENDING_OPEN` / `SEALED_FIRST_PRICE` / `SEALED_VICKREY` (default DESCENDING_OPEN)
- `floorPriceUsd` (옵션, 입찰 최저가)
- `takeRateBps` (베이시스 포인트, 화주 수수료 %)
- `carrierTakeRateBps` (선사 수수료)
- `serviceCode` (해상은 `forwardlink-ocean` 유지)

#### `Quote` 확장
- `cargoCategoryCode` (FK → CargoCategory.code)
- `cargoSubTypeCode` (FK → CargoSubType, nullable)
- `hsCode` (선택, 통관용)
- `incoterms` (FOB, CIF 등)
- `preferredCurrency` (화주 청구 통화)
- `shipperKycTier` (스냅샷)

#### `PoolParticipant` 확장
- `joinedVolumeTeu` (이 시점에 합류 시점의 누적 volume, 추적용)
- `cancelledReason`
- `depositId` (FK → Deposit, nullable)
- `finalInvoiceId` (FK → Invoice, nullable)
- **제약 변경**: `@@unique([poolId, userId])`는 유지 (R3). 한 사용자는 동일 풀 중복 참여 불가.

#### `AuctionBid` 확장
- `isSealed` (SEALED 모드에서만)
- `extendedAuction` (이 입찰이 연장을 유발했는지)
- `bidSource`: `MANUAL` / `AUTO_REBID` (API 자동 재응찰)
- `validUntilUtc` (자동 만료)

#### `User` 확장
- `kycTier` (스냅샷)
- `trustScoreCurrent` (denormalized)
- `defaultCurrency`
- `defaultIncoterms`
- `referralCode`

---

## 4. 사용자 여정 (User Journey)

### 4.1 화주(Shipper) 여정

```
[1] 회원가입 → [2] KYC 제출 → [3] KYC 승인 → 
[4] 견적 요청 작성 → [5] 추천 풀 매칭 → 
[6-A] 기존 풀 참여 (또는) [6-B] 신규 풀 생성 →
[7] 모집 마감 알림 → [8] 경매 시작 알림 →
[9] 낙찰 알림 → [10] 인보이스 확인/결제 →
[11] 컨테이너 반입/선적 → [12] BL 수령 → [13] 정산 완료
```

#### 단계별 핵심 액션

1. **회원가입**: 역할 선택(`SHIPPER` 또는 `FORWARDER`) → 사업자 정보 입력 → 이메일 인증.
2. **KYC 제출**: 사업자등록증, 수출입업 등록증, 통장 사본 업로드 → KYC 티어 선택 (`BASIC` / `VERIFIED`).
3. **KYC 승인**: 운영자 수동 검토(영업일 1~2일) → `kycStatus=APPROVED`.
4. **견적 요청 작성**:
   - 운송 모드(해상 FCL/LCL)
   - 출발항(POL) / 도착항(POD) 선택
   - **산업군(CargoCategory) 선택** ← **R1 핵심 UI**
   - 세부 물성(CargoSubType) 선택
   - 컨테이너 타입, 수량, 중량, CBM
   - 희망 ETD (날짜 범위 ±7일 입력 가능)
   - Incoterms, 희망 통화
5. **추천 풀 매칭**: 시스템이 동일 `cargoCategory` + 동일 구간 + ETD ±3일 내 `AGGREGATING` 풀을 추천. R3에 따라 사용자는 **여러 풀에 동시 참여 신청 가능**.
6-A. **기존 풀 참여**: 사용자가 마음에 드는 풀을 선택 → 해당 풀의 `currentVolumeTeu`에 자신의 볼륨 합산 → `JOINED` 상태.
6-B. **신규 풀 생성**: 매칭이 없거나, 사용자가 원할 경우 직접 풀 생성 → `cargoCategory`, `cargoSubType`, ETD 등을 확정 → 풀 상태 = `AGGREGATING` (R3-A).
7. **모집 마감(D-N)**: 시스템이 `auctionStartUtc` 도달 시 자동으로 `AUCTION`으로 전환.
8. **경매 진행**: 선사들이 블라인드 역경매로 입찰 (화주는 진행 상황 조회만 가능, 개방형일 경우 현재 최저가만 표시).
9. **낙찰 알림**: 화주 대시보드에 "낙찰 완료" 알림 → 최종 운임, 낙찰 선사명 공개.
10. **인보이스 확인**: 화주별 `Invoice`가 자동 생성 → 플랫폼 수수료 포함 금액 확인.
11. **컨테이너 반입**: 화주는 지정된 CY에 컨테이너 반입, 선사는 부킹 확정.
12. **선적 및 BL 수령**: 선적 후 B/L 발행.
13. **정산**: 화주가 인보이스 결제 → `Invoice.status=PAID` → 보증금 자동 환불 → Trust Score 가산.

### 4.2 선사(Carrier) 여정

```
[1] 회원가입 → [2] KYC + 선사 자격 검증 (FIATA/IATA) → 
[3] 운임표 등록 → [4] 경매 모니터링 → 
[5] 입찰 → [6] (선택) 재입찰 → 
[7] 낙찰 알림 → [8] 부킹 생성 → 
[9] 선적 진행 → [10] 정산/운임 수령
```

#### 단계별 핵심 액션

1. **회원가입**: 역할 `CARRIER` 선택.
2. **KYC + 자격 검증**: 사업자등록증 + 선사 등록 증빙 (SCAC 코드, NVOCC 라이선스, Lloyd's 등록 등).
3. **운임표 등록**: 자사 구간·물성·컨테이너별 기준 운임을 등록 (또는 자동 API 연동). 업데이트 주기 SLA가 있을 경우 미갱신 시 입찰 제한.
4. **경매 모니터링**: 자사가 취급 가능한 구간·물성의 `AUCTION` 상태 풀 리스트 조회.
5. **입찰**: 풀의 `cargoCategory`, 구간, 총량, ETD, 기준 운임(`scfiBaseRateUsd`)을 보고 `proposedRateUsd` 입력.
6. **재입찰**: 동일 선사가 더 낮은 가격으로 재입찰 가능 (R-OPEN 모드일 때만). 재입찰 시 시스템은 "현재 최저가" 알림을 기존 입찰 선사에게 발송.
7. **낙찰 알림**: `auctionEndUtc` 도달 → 최저가 입찰 선사가 `winningCarrierId`로 지정 → 알림 발송.
8. **부킹 생성**: 낙찰 선사는 각 참여자별로 부킹(BKG) 생성 → 컨테이너 할당.
9. **선적 진행**: ETD까지 컨테이너 픽업 → CY 반입 → 선적.
10. **정산/운임 수령**: 선사는 `Invoice`를 보고 플랫폼 수수료 차감 후 화주에게 직접 청구. 또는 플랫폼이 에스크로로 보관 후 분배.

### 4.3 포워더(Forwarder) 여정

포워더는 두 가지 모드로 활동한다.

- **Mode 1: 화주 대행**: 포워더가 자사 화주 물량을 모아 견적 요청 → 본인이 직접 `CoBuyPool` 생성·참여 (화주와 동일 플로우).
- **Mode 2: 셀러 포워더**: 포워더가 운임 스프레드(매입가 - 판매가)로 수익. LogisticsLink가 화주에게 운임을 노출하고, 포워더가 마진을 정산에서 차감.

### 4.4 운영자(Admin) 여정

- 화주/선사 KYC 검토 및 승인/반려
- 신규 산업군/세부물성 마스터 추가
- 유찰 풀 사후 처리 (수동 매칭, 단독 견적 전환)
- 분쟁(Dispute) 중재
- 운임 지수(SCFI 등) 주기 등록
- 매출/물량 KPI 모니터링

---

## 5. 공동구매 풀(Group Buy Pool) 라이프사이클

### 5.1 풀 상태 머신

```
DRAFT
  ↓ (화주가 생성 확정)
AGGREGATING
  ↓ (auctionStartUtc 도달, 자동/수동)
AUCTION_LIVE
  ↓ (auctionEndUtc 도달)
[분기]
  ├─ 낙찰 있음 → AWARDED → CONTRACTED → IN_SHIPMENT → COMPLETED
  ├─ 입찰 없음 → FAILED → 운영자 수동 처리
  └─ 화주 전원 이탈 → CANCELLED
  ↓ (분쟁 발생 시)
DISPUTED → RESOLVED
```

### 5.2 각 상태의 진입/유지 조건

| 상태 | 진입 조건 | 유지 기간 | 이탈 조건 |
|------|----------|----------|----------|
| `DRAFT` | 화주가 폼 작성 중 | 무한 (24시간 미저장 시 만료) | 제출 또는 폐기 |
| `AGGREGATING` | 화주가 풀 생성 확정 | `auctionStartUtc`까지 (default 14일) | 신규 참여 가능 |
| `AUCTION_LIVE` | `now >= auctionStartUtc` | default 7일 (연장 가능) | 신규 참여 차단, 입찰만 가능 |
| `AWARDED` | `auctionEndUtc` 도달 + 낙찰 존재 | 부킹 생성 시까지 (default 7일) | 부킹 미생성 시 `CONTRACT_PENDING` |
| `CONTRACTED` | 부킹 생성 완료 | ETD까지 | ETD 도달 시 `IN_SHIPMENT` |
| `IN_SHIPMENT` | ETD 도달 | 실제 선적 + 도착 | BL 발행 후 인보이스 마감 |
| `COMPLETED` | 모든 화주 결제 + 선적 완료 | 영구 | - |
| `FAILED` | 낙찰 없음 | 7일 | 운영자 수동 매칭 또는 단독 견적 |
| `CANCELLED` | 화주 전원 이탈 또는 운영자 취소 | 영구 | - |
| `DISPUTED` | 분쟁 신고 | 분쟁 해결 시까지 | `RESOLVED` 또는 `CANCELLED` |

### 5.3 풀 임계치(Threshold) 룰

```
AGGREGATING → AUCTION_LIVE 전환 조건:
  AND 조건:
    1) now >= auctionStartUtc
    2) currentVolumeTeu >= minVolumeTeu (default 4 TEU)
    3) currentParticipants >= minParticipants (default 2)
  
  OR 조건 (실패 시 FAILED_DUE_TO_THRESHOLD):
    4) 운영자 수동 override
```

운영자는 임계치 미달 풀을 다음 중 처리한다.

- **연장**: `auctionStartUtc`을 +7일 연장하고 화주에게 알림
- **단독 견적 전환**: 화주 1명이라도 일반 견적으로 전환 (별도 `QUOTE_STANDALONE` 워크플로)
- **폐기**: 풀 무효화

---

## 6. 매칭 알고리즘 (R1, R3 구현 핵심)

### 6.1 1차 매칭 (Hard Filter)

다음 조건을 모두 만족하는 풀만 후보가 된다.

```
1. pool.serviceCode = quote.serviceCode                       (해상 ↔ 해상)
2. pool.status = AGGREGATING                                    (모집 중)
3. pool.cargoCategoryCode = quote.cargoCategoryCode             [R1-A]
4. pool.polCode = quote.polCode
5. pool.podCode = quote.podCode
6. pool.containerType = quote.containerType                     (또는 null = any)
7. ABS(quote.targetEtd - pool.targetEtd) <= 3일                (ETD 윈도우)
8. pool.isHazardous = quote.isHazardous                         [R1-C]
9. pool.isReefer = quote.isReefer
10. pool.isHeavy = quote.isHeavy
11. (선택) pool.cargoSubTypeCode = quote.cargoSubTypeCode       [R1-B]
12. (선택) quote.volumeTeu + pool.currentVolumeTeu <= pool.maxVolumeTeu
```

### 6.2 2차 매칭 (Scoring)

```
score =
   30 * (구간 완전 일치) +
   20 * (ETD 차이 0일) +
   15 * (ETD 차이 1일) +
   10 * (ETD 차이 2일) +
    5 * (ETD 차이 3일) +
   15 * (세부물성 일치) +
   10 * (컨테이너 타입 일치) +
   10 * (물량 결합 효율) +
    5 * (Trust Score 높음, 90+) +
    5 * (KYC Tier = VERIFIED)
```

### 6.3 추천 노출 정책

- **score >= 85**: "강력 추천" 노출 + 우선 매칭 안내
- **70 <= score < 85**: "추천" 노출
- **score < 70**: 노출하지 않음 (필터링)

### 6.4 R3 (복수 참여) 구현

`PoolParticipant.@@unique([poolId, userId])` 제약을 그대로 유지하되, 다음 쿼리로 복수 참여를 허용한다.

```typescript
// 화주가 참여 가능한 모든 풀 (R3: 동일 풀 중복만 차단, 풀 간 복수는 허용)
const availablePools = await prisma.coBuyPool.findMany({
  where: {
    status: "AGGREGATING",
    cargoCategoryCode: quote.cargoCategoryCode,
    polCode: quote.polCode,
    podCode: quote.podCode,
    // ... 기타 하드 필터
    participants: {
      none: { userId: shipper.id }  // R3: 동일 풀 중복 방지
    }
  }
});
```

화주 UI는 **내가 참여 중인 풀 목록**과 **참여 가능한 신규 풀 추천**을 분리해 보여준다.

---

## 7. 역경매(Reserve Auction) 메커니즘

### 7.1 경매 포맷

| 포맷 | 코드 | 설명 | 사용 시점 |
|------|------|------|----------|
| 공개 하락형 | `DESCENDING_OPEN` | 현재 최저가가 공개되며, 선사는 그보다 낮게 응찰. 가장 일반적. | 기본 |
| 봉인 1가 | `SEALED_FIRST_PRICE` | 모든 선사가 1회 봉인 입찰, 최저가 낙찰. | 특수 산업군 |
| Vickrey (2가) | `SEALED_VICKREY` | 최저가 입찰자 낙찰, 단 2순위 가격 지불. | 대형 풀 |

기본은 `DESCENDING_OPEN`이다. 풀 생성 시 운영자가 변경 가능.

### 7.2 Anti-Sniping (자동 연장)

```
auctionEndUtc - now <= 5분 AND 신규 입찰 발생 시
  AND pool.extensionCount < pool.maxExtensionCount (default 3)
THEN
  auctionEndUtc = auctionEndUtc + 5분
  extensionCount += 1
  PoolExtension 레코드 기록
```

### 7.3 입찰 유효성 (확장)

기존 MVP의 `validateCarrierBid`에 다음을 추가한다.

```
- pool.status = AUCTION_LIVE
- now ∈ [auctionStartUtc, auctionEndUtc]
- carrier.status = ACTIVE
- carrier.kycStatus = APPROVED
- carrier.kycExpiresAt > now
- carrier.trustScore >= 70
- proposedRateUsd > 0
- proposedRateUsd < scfiBaseRateUsd (limitOverride=false일 때)
- (현재 최저가가 있는 경우) proposedRateUsd < currentLowestRate
- proposedRateUsd >= pool.floorPriceUsd (floorPrice가 있을 때)
- 포맷이 SEALED_*이면 동일 선사 중복 입찰 차단
```

### 7.4 낙찰 결정

```
1) auctionEndUtc 도달 → pool.status = AWARDED
2) bids 최저가 1건 → winning_carrier_id, final_rate_usd = bid.proposedRateUsd
3) bids 없음 → pool.status = FAILED
4) (동점 발생 시) 먼저 입찰한 선사 우선 (timestamp asc)
```

---

## 8. 수익 모델 (Take Rate)

### 8.1 화주 수수료 (Shipper Take Rate)

```
platformFeeUsd = baseFreightUsd * (takeRateBps / 10000)
```

| 화주 KYC Tier | 기본 takeRateBps | 조건 |
|---------------|------------------|------|
| `BASIC` | 400 (4.0%) | KYC 미승인 또는 BASIC |
| `VERIFIED` | 300 (3.0%) | 사업자등록 + 수출입업 등록 |
| `PREMIUM` | 200 (2.0%) | 재무 검증 완료 + 과거 6개월 10건+ 거래 |

### 8.2 선사 수수료 (Carrier Take Rate)

선사는 **월 구독료 + 거래 수수료**의 이중 모델이다.

```
월 구독료:
  - Standard: ₩300,000/월
  - Premium: ₩1,500,000/월 (우선 매칭, SLA 보장)
  - Enterprise: 별도 계약

거래 수수료:
  - finalRateUsd * carrierTakeRateBps (default 100 = 1.0%)
```

### 8.3 부가 서비스 수익

| 서비스 | 가격 정책 | 비고 |
|--------|----------|------|
| HS Code 자동 분류 | 건당 ₩5,000 | AI 모델 |
| MSDS 검증 | 건당 ₩30,000 | 배터리·화학 |
| 수출 통관 대행 | 관세사별 상이 | 제휴 |
| 통관 보험 | 보험료의 10% | |
| FX 환전 스프레드 | 0.3% | 외화 결제 시 |
| 데이터 분석 리포트 | 월 ₩500,000 | 화주/선사 대상 |
| 보증금 예치 운용 | 금리수익의 50% | 예치금 pool |

### 8.4 인보이스 구성 (확장)

```
┌─────────────────────────────────────┐
│  LogisticsLink Invoice #INV-2026-001│
├─────────────────────────────────────┤
│  [1] Base Freight         $2,800.00 │  ← 낙찰 운임 (pool 단위)
│  [2] THC                  $   120.00 │  ← Terminal Handling
│  [3] BAF (Fuel)           $   180.00 │  ← Bunker Adjustment
│  [4] CAF (Currency)       $    40.00 │  ← Currency Adj.
│  [5] Doc Fee              $    50.00 │
│  [6] Insurance            $    80.00 │
│  [7] Platform Fee (3.0%)  $    92.40 │  ← takeRateBps 적용
│  [8] VAT (10%)            $   336.24 │  ← [1]~[7] 합계의 10%
├─────────────────────────────────────┤
│  Subtotal (USD)            $3,698.64 │
│  FX Rate (USD/KRW)         1,350.00  │
│  Total (KRW)               ₩4,993,164│
└─────────────────────────────────────┘
```

### 8.5 환차 손익 (FX Buffer)

```
fxBufferRate = 0.5% (기본)
effectiveFxRate = marketFxRate * (1 - fxBufferRate)   // 화주 입장 (비싸게 산다)
effectiveFxRate = marketFxRate * (1 + fxBufferRate)   // 선사 입장 (싸게 받는다)
```

플랫폼이 1% 스프레드를 수익으로 본다.

---

## 9. 신뢰/안전 메커니즘

### 9.1 KYC (Know Your Customer) 티어

| Tier | 요구 서류 | 기능 | 비용 |
|------|----------|------|------|
| `BASIC` | 이메일 인증, 사업자등록증 | 견적 요청, 풀 참여 (최대 월 5 TEU) | 무료 |
| `VERIFIED` | + 수출입업 등록증, 통장 사본, 재무제표 | 풀 생성, 무제한 참여, takeRate 할인 | 무료 (검증 비용은 플랫폼) |
| `PREMIUM` | + 신용평가 보고서, PI보험 가입증명 | 우선 매칭, 대용량 풀 생성, takeRate 추가 할인 | 연 ₩500,000 |

### 9.2 Trust Score 시스템

**기본 점수: 100점** (범위: 0~150)

#### 화주 이벤트

| 이벤트 | 점수 변동 | 사유 |
|--------|----------|------|
| 풀 정상 완료 | +5 | on-time 결제, 정상 선적 |
| 풀 노쇼 (취소) | -15 | 결제 후 부킹 미진행 |
| 결제 지연 (1~7일) | -3 | 1주 단위 |
| 결제 지연 (8일+) | -10 | |
| 분쟁 패소 | -20 | |
| KYC 갱신 | +2 | |
| 6개월간 무사고 | +10 | |
| ADMIN_ADJUST | ±N | 운영자 수동 |

#### 선사 이벤트

| 이벤트 | 점수 변동 |
|--------|----------|
| 정상 부킹 완료 | +5 |
| 입찰 후 노쇼 (낙찰 후 부킹 거부) | -25 |
| 화주 클레임 (정당) | -15 |
| 운임표 SLA 미이행 | -5 (per week) |
| 분쟁 패소 | -20 |
| ADMIN_ADJUST | ±N |

#### 임계값별 효과

| 점수 | 효과 |
|------|------|
| 90+ | 모든 풀 참여 가능, 보증금 면제 (VERIFIED 한정) |
| 70~89 | 모든 풀 참여 가능, 보증금 1.0x |
| 50~69 | VERIFIED 풀만 참여 가능, 보증금 1.5x |
| 30~49 | BASIC 풀만 참여 가능, 보증금 2.0x |
| 30 미만 | 입찰/참여 차단, 운영자 검토 대기 |

### 9.3 보증금 시스템

#### 화주 보증금

```
depositAmount = baseFreightUsd * depositRate
depositRate = 0.10 (기본, KYC BASIC/VERIFIED)
           = 0.05 (PREMIUM)
           = 0.20 (Trust Score < 70)
```

- **시점**: 풀 낙찰 후 48시간 내
- **보관**: 플랫폼 에스크로 또는 제휴 은행 가상계좌
- **환불**: 정상 완료 후 7 영업일
- **몰수**: 노쇼/취소 시 (Trust Score 동시 차감)

#### 선사 입찰 보증금

```
bidDepositUsd = finalRateUsd * 0.02 (낙찰 후에만)
```

낙찰을 수락하면 보증금이 차감되고, 부킹 거절 시 몰수.

### 9.4 에스크로 & 결제

#### 화주 → 플랫폼
- 가상계좌, 카드, 계좌이체
- 인보이스 발행 후 `dueAt`까지 (default 7일)
- 미결제 시 자동 알림 → 7일 후 Trust Score -10

#### 플랫폼 → 선사
- 선적 완료 + B/L 발행 확인 후 선사에게 송금
- `holdbackRate = 0.05` (5%는 클레임 윈도우 30일 후 송금)

---

## 10. 정산 및 부대비용

### 10.1 부대비용(Accessorial Charges) 마스터

기존 MVP는 부대비용을 단순화했지만, 실제 비즈니스에서는 다음이 분리된다.

| 코드 | 영문 | 한국어 | 비고 |
|------|------|--------|------|
| `THC` | Terminal Handling Charge | 터미널 수수료 | 컨테이너당 |
| `BAF` | Bunker Adjustment Factor | 연료할증료 | % 또는 정액 |
| `CAF` | Currency Adjustment Factor | 환율할증료 | % |
| `EBS` | Emergency Bunker Surcharge | 비상 연료 할증 | |
| `ISPS` | International Ship & Port Security | 항만 보안료 | |
| `DOC_FEE` | Documentation Fee | 서류 발급료 | B/L당 |
| `SEAL_FEE` | Seal Fee | 봉인료 | 컨테이너당 |
| `TELEX_RELEASE` | Telex Release | 텔렉스 해지 | |
| `DETENTION` | Detention | 컨테이너 사용료 | |
| `DEMURRAGE` | Demurrage | 체선료 | |
| `CHASSIS` | Chassis Usage | 샤시 사용료 | |
| `INLAND` | Inland Transportation | 내륙운임 | |

### 10.2 부대비용의 배부 방식

3가지 모드를 지원한다.

| 모드 | 설명 | 사용 시점 |
|------|------|----------|
| `PER_CONTAINER` | 컨테이너당 동일 금액 | THC, ISPS, SEAL |
| `PER_SHIPPER` | 화주별 동일 금액 (부킹 단위) | DOC_FEE, TELEX |
| `PER_VOLUME` | volumeTeu 또는 cbm 비례 | BAF, CAF, INLAND |

`Invoice` 생성 시 풀의 부대비용 + 화주의 부대비용이 합산된다.

### 10.3 정산 시점

```
D+0  : ETD (선적일)
D+0  : BL Draft 발행
D+3  : B/L 원본 발행
D+14 : 화주 인보이스 발행 (Invoice.status=ISSUED)
D+14 ~ D+21 : 화주 결제 윈도우
D+21 : 선사 송금 (holdback 제외)
D+51 : holdback 송금 (클레임 윈도우 종료)
```

---

## 11. 산업군별 특화 운영

### 11.1 배터리 (BATTERY) 풀 특화 규칙

- **컨테이너 강제**: `20FT_DANGEROUS` 또는 `40FT_DANGEROUS`
- **필수 서류**: MSDS, UN38.3, 항공/해상 시험성적서
- **선사 자격**: DG 적재 허용 선사만 입찰 가능 (carrier.dgApproved = true)
- **보험**: 해상보험 강제 가입, 플랫폼이 추천 보험사 노출
- **풀 최소 물량**: 4 TEU (1 TEU만으로는 위험물 단독 부킹이 손익 분기 안 맞음)
- **추가 takeRate**: +50 bps (위험물 취급 위험 비용)

### 11.2 화학 (CHEMICAL) 풀 특화 규칙

- 위험물 클래스별 분리 (Class 3 인화성, Class 6 독성, Class 8 부식성)
- 탱커 컨테이너는 `20FT_TANKER`, `40FT_TANKER`
- REACH 등록 확인 (EU 수출 시)

### 11.3 식품 (FOOD_AGRI) 풀 특화 규칙

- `IS_REEFER` 강제
- 냉장(-2~8°C) vs 냉동(-25°C 이하) 분리 풀
- 검역 서류 (Phytosanitary Certificate) 사전 안내
- HS Code 기반检疫 필요 국가 자동 경고

### 11.4 전자 (ELECTRONICS) 풀 특화 규칙

- 정전기 방지 포장 권장
- 통관 시 KCSI (한국 관세사협회) 원산지 증명 자동 매칭
- 아이콘 (구미, EU RoHS 등) 자동 체크

---

## 12. KPI 및 운영 지표

### 12.1 North Star Metric

**월간 낙찰 화주 1인당 평균 TEU** (활성 화주의 깊이를 측정)

### 12.2 카테고리별 KPI

| 카테고리 | 지표 | 목표 |
|---------|------|------|
| **수요 측 (Demand)** | 활성 화주 수 | 월 +20% |
| | 화주당 월 평균 견적 요청 | 4건 |
| | 견적 → 풀 참여 전환율 | 70% |
| **공급 측 (Supply)** | 등록 선사 수 | 30사 (1년 차) |
| | 입찰 응찰률 | 60% (AUCTION 풀 중) |
| | 입찰 → 낙찰 전환율 | 95% |
| **매칭 (Matching)** | 풀 평균 형성 기간 | 7일 |
| | 풀 평균 참여 화주 수 | 4사 |
| | 풀 평균 물량 | 12 TEU |
| **낙찰 (Auction)** | 평균 낙찰가 = 기준가의 % | 75% (25% 할인) |
| | 유찰률 | 10% 이하 |
| | 평균 입찰 횟수 | 5회/풀 |
| **금융 (Finance)** | 화주 AR 회수 기간 | 14일 |
| | 선사 AP 지급 기간 | 21일 |
| | Trust Score 평균 | 90+ |
| | 보증금 몰수율 | 5% 이하 |
| **만족도 (Satisfaction)** | NPS (화주) | 50+ |
| | NPS (선사) | 40+ |
| | 재거래율 (12개월) | 60% |

### 12.3 리포팅 주기

| 리포트 | 대상 | 주기 |
|--------|------|------|
| 산업군별 운임 추이 | 세일즈, 운영 | 주 1회 |
| 화주 단가 절감액 | 화주 | 월 1회 (자동) |
| 선사 입찰 성과 | 선사 | 월 1회 |
| 매출/물량 대시보드 | 경영진 | 실시간 (BI) |
| 분쟁·클레임 통계 | 운영, 법무 | 주 1회 |

---

## 13. 마이그레이션 로드맵 (기존 MVP → v2.0)

### 13.1 데이터 마이그레이션

1. **CargoCategory 마스터** 신규 INSERT (13개 산업군)
2. **CargoSubType** 신규 INSERT (산업군당 3~10개 = 약 50개)
3. **기존 `Quote.cargoType` 값**을 `CargoCategory` 코드에 매핑 (마이그레이션 스크립트)
4. **기존 `CoBuyPool.cargoType`**도 동일 매핑
5. **`Quote.cargoCategoryCode`, `CoBuyPool.cargoCategoryCode`** 컬럼 추가 후 NOT NULL
6. **`KycProfile`** 신규 테이블 생성 (기존 User는 BASIC 티어로 시작)
7. **`TrustScore`** 신규 테이블 생성 (기존 User.trustScore 값 그대로 이관)
8. **`Invoice`, `Deposit`, `PoolExtension`** 신규 테이블 생성

### 13.2 코드 마이그레이션 (호환성 유지)

- `forwardlink-ocean` 서비스 코드는 유지
- `cargoType` 컬럼은 **하위 호환을 위해 유지**하되, 신규 코드는 `cargoCategoryCode` 사용
- 매칭 로직은 `cargoCategoryCode` 우선, `cargoType`은 fallback
- API v1 (MVP 호환) + API v2 (비즈니스 룰 반영) 동시 운영 후 단계적 deprecate

### 13.3 단계적 출시

| 단계 | 기간 | 목표 |
|------|------|------|
| **Phase 0: 기반** | 4주 | CargoCategory 마스터, KYC Tier 시스템, Trust Score 이벤트 인프라 |
| **Phase 1: 화주 풀** | 6주 | 산업군 선택 UI, 매칭 알고리즘 v2, 복수 참여 UX |
| **Phase 2: 선사 풀** | 4주 | KYC Tier 기반 자격 검증, 운임표 등록 고도화 |
| **Phase 3: 정산** | 6주 | Invoice/Deposit 시스템, 부대비용 분리, FX Buffer |
| **Phase 4: 수익화** | 4주 | takeRate 적용, 선사 월 구독료, 부가 서비스 |
| **Phase 5: 산업군 특화** | 8주 | 배터리/화학/식품 풀 특화 룰, DG 적재 검증 |

총 약 **32주 (8개월)**.

---

## 14. 리스크와 완화책

| 리스크 | 영향 | 발생 확률 | 완화책 |
|--------|------|----------|--------|
| 화주 노쇼 (낙찰 후 취소) | 선사 매출 손실, 플랫폼 평판 | 중 | 보증금 + Trust Score 동시 적용 |
| 선사 노쇼 (낙찰 후 부킹 거부) | 화주 출하 지연 | 중 | 입찰 보증금, Trust Score -25 |
| 유찰률 급등 (10%+) | 화주 이탈 | 중 | 임계치 자동 연장, 운영자 수동 매칭 |
| SCFI/FBX 급등 (낙찰 후) | 선사 마진 마이너스 | 고 | 운임 변동 조항 (선사 옵션), 가격 ceiling |
| 위조 사업자등록증 | 사기 | 저 | KYC 1차 수동 검토 + 연 1회 갱신 |
| 다중 계정 우회 (Trust Score 회피) | 플랫폼 신뢰 훼손 | 중 | 디바이스 핑거프린트, 사업자번호-계좌 매칭, IP 모니터링 |
| HS Code 통관 오류 | 벌금, 화물 압류 | 중 | AI 자동 추천 + 관세사 검수 옵션 |
| 배터리/화학 안전사고 | 보험, 법적 책임 | 저 | 위험물 풀 자격 검증 강화, 보험 강제 |
| GDPR/PIPA 위반 (개인정보) | 과징금, 평판 | 중 | 데이터 보존 정책, anonymization, 사용자 동의 |
| FX 급변 (결제 시점) | 화주·선사 환차 손실 | 고 | FX Buffer 0.5% 흡수, forward contract 옵션 |

---

## 15. 본 문서가 결정하는 핵심 변경 요약

| 영역 | 기존 MVP | v2.0 비즈니스 모델 |
|------|----------|-------------------|
| **물성 분류** | `cargoType` (단순 String) | `cargoCategory` (13개 산업군) + `cargoSubType` (세부) |
| **매칭 키** | cargoType + containerType | `cargoCategory` + 구간 + ETD + 특수취급 |
| **복수 참여** | 사실상 가능 (R3) | 명문화 + UI 분리 ("참여 중" / "참여 가능") |
| **화주 인증** | 단순 ACTIVE | KYC Tier 3단계 + 연 1회 갱신 |
| **신뢰 시스템** | Trust Score 1개 컬럼 | Trust Score + 이벤트 로그 + 임계값 룰 |
| **수익 모델** | 미정의 | Take Rate (화주 2~4%, 선사 1%) + 구독료 + 부가서비스 |
| **정산** | 미구현 | Invoice + 부대비용 분리 + FX Buffer + 에스크로 |
| **경매 포맷** | 공개 하락형 고정 | 3가지 (OPEN / Vickrey / Sealed) |
| **연장** | 미구현 | Anti-Sniping 자동 5분 연장 (최대 3회) |
| **산업군 특화** | 없음 | 배터리·화학·식품·전자별 룰 |
| **풀 임계치** | 없음 | minParticipants/minVolumeTeu |
| **서비스 확장** | forwardlink-ocean 1개 | platform + 4 services (ocean/active, air/inland/warehouse/planned) |

---

## 부록 A. 용어 사전

- **Group Buy Pool (공동구매 풀)**: 동일 산업군·구간·ETD 윈도우 내에서 화주들의 물량을 묶은 단위. 본 문서에서 "풀"이라 함.
- **Reverse Auction (역경매)**: 수요자가 복수의 공급자에게 가격을 받아 최저가를 선택하는 방식. 본 플랫폼의 핵심.
- **Cargo Category (산업군)**: ELECTRONICS, BATTERY 등 13개 분류.
- **KYC (Know Your Customer)**: 사업자 신원 확인 절차.
- **Trust Score**: 사용자 행동 기반 신용 점수 (0~150).
- **Take Rate (중개 수수료)**: 낙찰 운임 대비 플랫폼 수수료율.
- **Incoterms**: 국제무역거래조건 (FOB, CIF 등).
- **HS Code**: 국제통일상품분류코드 (6~10자리).
- **DG (Dangerous Goods)**: 위험물. UN 위험물 등급 1~9.
- **THC/BAF/CAF**: 터미널/연료/환율 할증료.
- **D+N**: ETD 기준 N일 후. 예: D+14 = ETD 14일 후.

---

## 부록 B. 변경 이력

| 버전 | 일자 | 변경 |
|------|------|------|
| v1.0 | 2026-05-26 | ForwardLink 개발용 PRD (MVP) |
| v2.0 | 2026-06-07 | LogisticsLink 비즈니스 플로우 마스터 (본 문서). 산업군 분류, 복수 참여 룰 명문화, 수익 모델, KYC/Trust Score/정산 시스템 추가. |
