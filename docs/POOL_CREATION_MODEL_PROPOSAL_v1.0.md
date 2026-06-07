# POOL_CREATION_MODEL_PROPOSAL v1.0 (A5 갱신)

> **원본**: `docs/POOL_CREATION_MODEL_PROPOSAL.md` (v0.1)
> **갱신일**: 2026-06-07
> **상태**: 🟢 v1.0 확정 (D-1~D-8 결정안 반영, A2 + A3 마이그레이션 적용 완료)

---

## 0. v0.1 → v1.0 변경 요약

본 문서는 v0.1에 **MASTER_RECONCILIATION.md의 결정 D-1~D-8을 모두 반영**한 v1.0 갱신본입니다. 결정 D-1, D-6이 이미 A2 마이그레이션으로 적용되었고, D-4가 A3 마이그레이션으로 적용되었습니다.

| 결정 | 영향 | v1.0 반영 |
|------|------|----------|
| D-1 (PoolStatus 10-state) | COLLECTING → AGGREGATING, AUCTION_LIVE/IN_SHIPMENT/CONTRACTED/DISPUTED 추가 | ✅ 반영 |
| D-2 (ETD Window Phase별) | Phase 1: 단일값, Phase 3+: window 추가 | ✅ 반영 |
| D-3 (PoolParticipant unique) | `@@unique([poolId, userId])` (R3 유지) | ✅ 반영 |
| D-4 (Phase별 엔터티) | A3 마이그레이션으로 KycProfile/TrustScore/Deposit/PoolExtension 추가 | ✅ 반영 |
| D-5 (운임 기준선) | FreightRateBenchmark 테이블 우선 | ✅ 반영 |
| D-6 (Cargo 2단계) | `cargoCategoryCode` + `cargoSubTypeId` (FK) | ✅ 반영 |
| D-7 (풀 생성 권한) | Phase 1: 화주 명시 / Phase 3+: 자동 | ✅ 반영 |
| D-8 (Overlap Prevention) | Phase 1: ±3일, Phase 3+: window 기반 | ✅ 반영 |

---

## 1. Phase별 풀 생성 모델 (D-7 기반)

### Phase 1 (출시 ~ 3개월) — D-7 모드 1

- **권한**: 화주(VERIFIED+ KYC Tier) 또는 운영자
- **방법**: 화주가 명시적으로 `CoBuyPool` 생성 → 다른 화주 합류 대기
- **Overlap Prevention (D-8)**: 동일 `cargoCategory + POL + POD + containerType + isHazardous + isReefer + isHeavy` 조합에서 `ABS(pool.targetEtd - quote.targetEtd) ≤ 3일`이면 차단
- **Cargo 2단계 (D-6)**: `cargoCategoryCode` (FK) + `cargoSubTypeId` (FK, nullable)
- **Cargo window (D-2)**: 단일값 (`targetEtd`)

### Phase 3 (4~6개월) — D-7 모드 2

- **권한**: 화주가 needs를 등록 → 시스템이 자동 클러스터링 → 풀 후보 생성 → 운영자/화주 검증 후 정식 풀 확정
- **자동 확정 모드**: N=24h 내 거부 없으면 자동 정식 풀
- **수동 확정 모드**: 화주 중 누구라도 명시적 confirm
- **Overlap Prevention (D-8)**: window 기반 (Phase 3 ETD window 도입)
- **Cargo window (D-2)**: `etdWindowStart`, `etdWindowEnd` 추가 (nullable, 하위 호환)

### Phase 5+ (7개월+) — D-7 모드 3

- **양방향 자동 조정**: needs/풀 양방향
- **선사 수요 기반 역방향 클러스터링**: 선사가 선호 구간/물성 제시 → 화주 needs 유도
- **풀 자율 진화**: 풀 형성 시간 7일 → 3일 목표

---

## 2. Auto-Clustering 알고리즘 (Phase 3 기준)

```typescript
// 의사코드 (실제 구현은 CLUSTER_API_PHASE3_EXTRACTION.md 참조)
function clusterOpenNeeds(openNeeds: NeedRequest[]): PoolCandidate[] {
  // 1. 동일 needs 그룹핑
  const groups = groupBy(openNeeds, (n) =>
    `${n.cargoCategoryCode}|${n.cargoSubTypeId ?? ''}|${n.polCode}|${n.podCode}|${n.containerType ?? ''}|${n.isHazardous}|${n.isReefer}|${n.isHeavy}`
  );

  // 2. 각 그룹에서 ETD window 교집합 분석
  const candidates: PoolCandidate[] = [];
  for (const needs of Object.values(groups)) {
    const intersections = computeEtdIntersections(needs, minRangeDays = 3);
    for (const range of intersections) {
      const candidateNeeds = needs.filter(n =>
        n.etdWindowStart <= range.end && n.etdWindowEnd >= range.start
      );
      const totalVolume = sum(candidateNeeds.map(n => n.volumeTeu));
      if (totalVolume >= POOL_MIN_VOLUME && candidateNeeds.length >= POOL_MIN_PARTICIPANTS) {
        candidates.push({
          needs: candidateNeeds,
          etdRange: range,
          score: totalVolume * candidateNeeds.length,
        });
      }
    }
  }
  return candidates;
}
```

---

## 3. R6 Pool Overlap Prevention (D-8)

```typescript
// Phase 1 룰
const ETD_WINDOW_DAYS = 3;
const lowerBound = new Date(targetEtd.getTime() - ETD_WINDOW_DAYS * 24 * 60 * 60 * 1000);
const upperBound = new Date(targetEtd.getTime() + ETD_WINDOW_DAYS * 24 * 60 * 60 * 1000);

const matchingPool = await prisma.coBuyPool.findFirst({
  where: {
    serviceCode: targetQuote.serviceCode,
    cargoCategoryCode: targetQuote.cargoCategoryCode,
    cargoSubTypeId: targetQuote.cargoSubTypeId ?? null,
    polCode: targetQuote.polCode,
    podCode: targetQuote.podCode,
    containerType: targetQuote.containerType ?? undefined,
    isHazardous: targetQuote.isHazardous,
    isReefer: targetQuote.isReefer,
    isHeavy: targetQuote.isHeavy,
    status: PoolStatus.AGGREGATING,
    targetEtd: { gte: lowerBound, lte: upperBound },
    // R3: 동일 풀 중복 차단
    participants: { none: { userId: targetQuote.requesterId } },
  },
});
```

---

## 4. 결정 매트릭스 (v0.1 vs v1.0)

| 항목 | v0.1 제안 | v1.0 확정 | 출처 |
|------|----------|----------|------|
| PoolStatus | (제안 없음) | 10-state 통합 (D-1) | D-1 |
| Cargo 분류 | 2단계 FK | 2단계 FK (D-6) | D-6 |
| ETD | Phase별 | Phase 1: 단일 / Phase 3+: window (D-2) | D-2 |
| PoolParticipant | `@@unique([poolId, userId])` | 동일 (R3) (D-3) | D-3 |
| 신규 엔터티 | A3 마이그레이션 | KycProfile/TrustScore/Deposit/PoolExtension (D-4) | D-4 |
| 운임 기준선 | B의 FreightRateBenchmark | B 우선 (D-5) | D-5 |
| 풀 생성 | Phase별 | Phase 1: 명시 / Phase 3+: 자동 (D-7) | D-7 |
| Overlap | window + flag | Phase 1: ±3일 / Phase 3+: window (D-8) | D-8 |

---

## 5. 변경 이력

| 버전 | 일자 | 변경 |
|------|------|------|
| v0.1 | 2026-06-07 | 초안 (방식 A vs B 비교, 하이브리드 제안) |
| **v1.0** | **2026-06-07** | **D-1~D-8 결정 반영. A2 + A3 마이그레이션 적용 사실 반영. Phase별 진화 경로 명시.** |
