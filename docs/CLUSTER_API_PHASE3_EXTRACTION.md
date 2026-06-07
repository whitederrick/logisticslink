# Cluster API Phase 3 추출 문서 (A4)

> **근거 문서**: `reference/detail_plan.docx` Part 2, §3.1 (POST /api/quotes/cluster)
> **작업 일자**: 2026-06-07
> **상태**: 🟡 Phase 3 PR 대기 (A2 + A3 마이그레이션 적용 후)

---

## 0. TL;DR

`detail_plan.docx`의 클러스터링 API 코드를 **현재 스키마(MASTER_RECONCILIATION.md D-1~D-8 적용 후)** 에 맞게 수정한 Phase 3 PR용 코드를 정리합니다.

---

## 1. detail_plan.docx 원본 코드 (Part 2, §3.1)

```typescript
// =====================================================================
// 원본: reference/detail_plan.docx, Part 2, §3.1
// 엔드포인트: POST /api/quotes/cluster
// =====================================================================
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { quoteId } = await request.json();
    
    // 1. 타겟 화주 Needs 로드
    const targetQuote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { cargoCategory: true }
    });

    if (!targetQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // [R1 물성 분리 규칙 연산]
    // 동일 구간(POL, POD) 및 동일 물성(cargoCode), 동일 서비스 세그먼트를 공유하며, 
    // 화주의 목표 ETD 범위 내에 윈도우가 들어오는 수집 단계(COLLECTING)의 기존 풀을 검색
    const matchingPool = await prisma.coBuyPool.findFirst({
      where: {
        serviceCode: targetQuote.serviceCode,
        cargoCode: targetQuote.cargoCode,
        polCode: targetQuote.polCode,
        podCode: targetQuote.podCode,
        status: 'COLLECTING',
        etdWindowStart: { lte: targetQuote.targetEtdEnd },
        etdWindowEnd: { gte: targetQuote.targetEtdStart }
      }
    });

    if (matchingPool) {
      // 2. 최적 매칭 풀이 존재할 경우 트랜잭션 배부 처리
      await prisma.$transaction(async (tx) => {
        await tx.poolParticipant.create({
          data: {
            poolId: matchingPool.id,
            userId: targetQuote.userId,
            quoteId: targetQuote.id,
            allocatedTeu: targetQuote.volumeTeu
          }
        });
        await tx.coBuyPool.update({
          where: { id: matchingPool.id },
          data: { totalVolumeTeu: { increment: targetQuote.volumeTeu } }
        });
      });
      return NextResponse.json({ status: 'MERGED_INTO_EXISTING_POOL', poolId: matchingPool.id });
    } else {
      // 3. 매칭되는 풀이 없을 경우 신규 CoBuyPool 자율 독립 생성
      const newPool = await prisma.coBuyPool.create({
        data: {
          serviceCode: targetQuote.serviceCode,
          cargoCode: targetQuote.cargoCode,
          polCode: targetQuote.polCode,
          podCode: targetQuote.podCode,
          etdWindowStart: targetQuote.targetEtdStart,
          etdWindowEnd: targetQuote.targetEtdEnd,
          status: 'COLLECTING',
          totalVolumeTeu: targetQuote.volumeTeu,
          limitFreightUsd: 2500.00,
          auctionEndUtc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
      await prisma.poolParticipant.create({
        data: {
          poolId: newPool.id,
          userId: targetQuote.userId,
          quoteId: targetQuote.id,
          allocatedTeu: targetQuote.volumeTeu
        }
      });
      return NextResponse.json({ status: 'NEW_POOL_GENERATED', poolId: newPool.id });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 2. Phase 3 적용 시 수정사항 (MASTER_RECONCILIATION D-1~D-8 반영)

### 2.1 스키마 차이 매핑

| detail_plan 항목 | 현재 스키마 (마이그레이션 후) | 비고 |
|------------------|------------------------------|------|
| `status: 'COLLECTING'` | `PoolStatus.AGGREGATING` | D-1: 10-state 통합 |
| `cargoCode` (String FK) | `cargoCategoryCode` (FK CargoCategory) + `cargoSubTypeId` (FK CargoSubType) | D-6: 2단계 분류 |
| `etdWindowStart`, `etdWindowEnd` | `targetEtd` (Phase 1: 단일값) / Phase 3+: `etdWindowStart/End` 추가 | D-2: Phase별 점진 도입 |
| `limitFreightUsd` | `CoBuyPool.scfiBaseRateUsd` + 별도 `FreightRateBenchmark` | D-5: Benchmark 우선 |
| `allocatedTeu` | `volumeTeu` (PoolParticipant 필드명) | 명명 통일 |
| `@@unique([poolId, userId, quoteId])` | `@@unique([poolId, userId])` (R3) | D-3: R3 유지 |

### 2.2 Phase 3 수정 코드 (현재 스키마 호환)

```typescript
// =====================================================================
// Phase 3 PR 코드: src/app/api/quotes/cluster/route.ts
// 스키마: prisma/schema.prisma (A2 + A3 마이그레이션 적용 후)
// =====================================================================
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PoolStatus, QuoteStatus, UserRole } from '@prisma/client';

/**
 * POST /api/quotes/cluster
 * 
 * 화주의 신규 Quote(Needs)를 등록하거나 시스템 스케줄러가 매시간 실행될 때
 * 백엔드에서 자동 클러스터링 연산을 처리합니다.
 * 
 * 비즈니스 룰:
 * - R1: 동일 cargoCategory + POL + POD + 특수취급 flag 일치해야 매칭 후보
 * - R3: 동일 풀 내 중복 참여 차단 (PoolParticipant @@unique [poolId, userId])
 * - R6 (Phase 1): ±3일 윈도우 내 매칭
 * - R6 (Phase 3): etdWindowStart ≤ targetEtdEnd AND etdWindowEnd ≥ targetEtdStart
 */
export async function POST(request: Request) {
  try {
    const { quoteId } = await request.json();
    
    // 1. 타겟 화주 Needs 로드
    const targetQuote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { 
        cargoCategory: true,
        cargoSubType: true,
      }
    });

    if (!targetQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (!targetQuote.cargoCategoryCode) {
      return NextResponse.json(
        { error: 'cargoCategoryCode is required (R1: 산업군 분류 필수)' },
        { status: 400 }
      );
    }

    // 2. [R1 + R6 Phase 1] 매칭 풀 검색
    // - 동일 cargoCategory, POL, POD, containerType, isHazardous, isReefer
    // - ETD 차이 ≤ 3일 (Phase 1 룰)
    // - status = AGGREGATING
    const ETD_WINDOW_DAYS = 3;
    const lowerBound = new Date(targetQuote.targetEtd.getTime() - ETD_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const upperBound = new Date(targetQuote.targetEtd.getTime() + ETD_WINDOW_DAYS * 24 * 60 * 60 * 1000);

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
        targetEtd: {
          gte: lowerBound,
          lte: upperBound,
        },
        // R3: 동일 풀 중복 차단
        participants: {
          none: { userId: targetQuote.requesterId },
        },
        // 풀 용량 체크
        // totalVolumeTeu + targetQuote.volumeTeu <= maxVolumeTeu
      },
      orderBy: {
        targetEtd: 'asc', // 가장 가까운 ETD 우선
      },
    });

    if (matchingPool) {
      // 3. 매칭 풀에 참여자 추가 (R3: 중복 참여 불가)
      const result = await prisma.$transaction(async (tx) => {
        // 중복 체크 (이중 안전)
        const existing = await tx.poolParticipant.findUnique({
          where: {
            poolId_userId: {
              poolId: matchingPool.id,
              userId: targetQuote.requesterId,
            },
          },
        });
        if (existing) {
          throw new Error('이미 해당 풀에 참여 중입니다 (R3)');
        }

        // 참여자 등록
        await tx.poolParticipant.create({
          data: {
            poolId: matchingPool.id,
            userId: targetQuote.requesterId,
            quoteId: targetQuote.id,
            role: targetQuote.requesterRole,
            volumeTeu: targetQuote.quantity ?? 0,
            status: 'JOINED',
          },
        });

        // 풀 누적 볼륨 갱신
        const updated = await tx.coBuyPool.update({
          where: { id: matchingPool.id },
          data: {
            totalVolumeTeu: {
              increment: targetQuote.quantity ?? 0,
            },
          },
        });

        // TrustScore 이벤트 로깅
        await tx.trustScore.create({
          data: {
            userId: targetQuote.requesterId,
            eventType: 'POOL_JOIN_SUCCESS',
            scoreDelta: 0,
            reason: `Pool ${matchingPool.id} 참여`,
            relatedEntityType: 'CoBuyPool',
            relatedEntityId: matchingPool.id,
            effectiveScore: 100, // User.trustScoreCurrent 스냅샷
          },
        });

        return updated;
      });

      return NextResponse.json({
        status: 'MERGED_INTO_EXISTING_POOL',
        poolId: matchingPool.id,
        newVolumeTeu: result.totalVolumeTeu,
      });
    } else {
      // 4. 매칭 풀 없음 → 신규 풀 생성 (D-7 Phase 1: 화주 명시적 풀 생성)
      const scfiBenchmark = await prisma.freightRateBenchmark.findFirst({
        where: {
          polCode: targetQuote.polCode,
          podCode: targetQuote.podCode,
          containerGroup: targetQuote.containerType ?? '40FT_DRY',
          validTo: null,
        },
        orderBy: { validFrom: 'desc' },
      });

      const newPool = await prisma.$transaction(async (tx) => {
        // 신규 풀 생성
        const pool = await tx.coBuyPool.create({
          data: {
            serviceCode: targetQuote.serviceCode,
            createdById: targetQuote.requesterId,
            polCode: targetQuote.polCode,
            podCode: targetQuote.podCode,
            targetEtd: targetQuote.targetEtd,
            cargoType: targetQuote.cargoType, // deprecated, 하위 호환
            cargoCategoryCode: targetQuote.cargoCategoryCode,
            cargoSubTypeId: targetQuote.cargoSubTypeId,
            containerType: targetQuote.containerType,
            isHazardous: targetQuote.isHazardous,
            isReefer: targetQuote.isReefer,
            isHeavy: targetQuote.isHeavy,
            totalVolumeTeu: targetQuote.quantity ?? 0,
            status: PoolStatus.AGGREGATING,
            auctionStartUtc: new Date(), // 즉시 시작
            auctionEndUtc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
            scfiBaseRateUsd: scfiBenchmark?.rateUsd ?? 2500.00,
          },
        });

        // 생성자를 참여자로 자동 추가
        await tx.poolParticipant.create({
          data: {
            poolId: pool.id,
            userId: targetQuote.requesterId,
            quoteId: targetQuote.id,
            role: targetQuote.requesterRole,
            volumeTeu: targetQuote.quantity ?? 0,
            status: 'JOINED',
          },
        });

        // TrustScore 이벤트
        await tx.trustScore.create({
          data: {
            userId: targetQuote.requesterId,
            eventType: 'POOL_JOIN_SUCCESS',
            scoreDelta: 0,
            reason: `신규 풀 ${pool.id} 생성 및 참여`,
            relatedEntityType: 'CoBuyPool',
            relatedEntityId: pool.id,
            effectiveScore: 100,
          },
        });

        return pool;
      });

      return NextResponse.json({
        status: 'NEW_POOL_GENERATED',
        poolId: newPool.id,
      });
    }
  } catch (error: any) {
    console.error('[Cluster API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 3. Phase 3 PR 체크리스트

- [ ] `prisma/schema.prisma` A2 + A3 마이그레이션 적용 완료
- [ ] `npx prisma generate` 성공
- [ ] 위 코드를 `src/app/api/quotes/cluster/route.ts`에 추가
- [ ] `@prisma/client` import 확인
- [ ] 단위 테스트 작성 (매칭 풀 존재/미존재, R3 중복 차단)
- [ ] 통합 테스트 (실제 DB 연동)
- [ ] E2E 테스트 (UI에서 풀 생성 → 클러스터링)

---

## 4. 후속 작업

- **Phase 3 후**: Auto-Clustering cron 스케줄러 (`src/lib/cluster-scheduler.ts`) 구현
- **Phase 5+**: 양방향 자동 조정 (선사 수요 기반 역방향 클러스터링)
