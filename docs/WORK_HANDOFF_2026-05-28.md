# LogisticsLink 작업 인수인계 메모

작성일: 2026-05-28  
작업 위치: `C:\myProjects\logisticslink`

## 현재 상태

- Next.js + TypeScript + Prisma + PostgreSQL 기반 MVP입니다.
- 기본 UI 언어는 한국어이고, `?lang=en`으로 영어 전환을 지원합니다.
- Docker PostgreSQL은 `localhost:5433`을 사용합니다.
- 최근 검증 기준으로 `next build` 성공, 테스트 `6 passed` 상태입니다.
- 사용자가 `npm run db:up`과 `npm run dev`로 PostgreSQL 및 3001 개발 서버를 실행한 상태에서 주요 화면과 API를 확인했습니다.

## 주요 구현 완료

- `/dashboard`를 원클릭 데모 버튼이 아닌 역할 선택 및 운영 파이프라인 게이트웨이로 변경했습니다.
- `/shipper`, `/forwarder`, `/carrier`, `/admin` 역할별 MVP 화면을 만들었습니다.
- `AppShell`에 한국어/English 토글과 메인 비즈니스 절차 네비게이션을 추가했습니다.
- 메인 절차는 `화물 등록 → 공동구매 집계 → 타임락 전환 → 역경매 → 낙찰 확정 → 운송 후속 관리`입니다.
- 회원가입 화면을 실제 UI로 연결했습니다.
  - 25개 국가
  - 11개 업종
  - 이메일/사업자번호 중복 체크
  - 약관 스크롤 후 동의
- 로그인/로그아웃과 HttpOnly 세션 쿠키 기반 인증을 추가했습니다.
- 역할별 접근 제어를 적용했습니다.
  - 화주/포워더: 본인 견적과 참여 풀 중심
  - 선사: 경매 상태 풀과 본인 입찰 원장
  - 관리자: 전체 풀, 참여자, 입찰, 운임 기준, 타임락 배치
- 추천 공동구매 UX를 개선했습니다.
  - 견적 생성 후 추천 풀 자동 조회
  - 매칭률, 예상 할인율, 현재 집계 물량 표시
  - 추천 풀이 없으면 해당 견적으로 새 풀 생성 가능
- 선사 실시간 역경매 보드를 추가했습니다.
  - `/api/auctions/live` polling
  - 현재 최저가, 입찰 수, 참여자 수, 내 입찰 원장 표시
- 타임락 자동화 엔드포인트를 추가했습니다.
  - `/api/cron/time-lock`
  - `CRON_SECRET` 기반 호출
- 관리자 운임 기준 관리 기능을 추가했습니다.
  - `FreightRateBenchmark` DB 테이블
  - `SCFI`, `CARRIER_FAK`, `CARRIER_PUBLIC_TARIFF`, `INTERNAL_MASTER`
  - `/api/admin/rate-benchmarks`
  - 관리자 화면에서 운임 기준 직접 등록/갱신/수정/삭제
  - `PATCH /api/admin/rate-benchmarks/[id]`
  - `DELETE /api/admin/rate-benchmarks/[id]`
  - CSV import UI 및 `POST /api/admin/rate-benchmarks/import`
  - CSV 헤더: `source,sourceLabel,polCode,podCode,containerGroup,rateUsd,validFrom`
  - 설정 기반 운임 기준 CSV 소스 동기화
  - `RATE_BENCHMARK_CSV_SOURCES`
  - `POST /api/admin/rate-benchmarks/sync`
  - `GET /api/cron/rate-benchmarks`
- 역경매 상한가는 여러 운임 기준 중 가장 낮은 값을 적용합니다.
- 낙찰 이후 운송 후속 관리 화면을 추가했습니다.
  - `AWARDED → SHIPMENT_IN_PROGRESS → COMPLETED`
  - 관리자 화면에서 상태 전환 가능
  - 화주/포워더/선사는 관련 운송 후속 상태 조회
  - 선사는 본인이 낙찰받은 운송 건 조회
- API 요청 계약 테스트를 보강했습니다.
  - route id 양수 검증
  - 입찰 요청 payload 검증
  - 추천 풀 참여 요청 payload 및 충돌/불일치 규칙
  - 운송 후속 상태 payload 검증
- README를 한국어 운영 문서 기준으로 정리했습니다.
- 깨진 한국어 문구를 여러 화면에서 정리했습니다.
  - 회원가입
  - 화주/포워더 견적 생성 및 추천 UX
  - 공통 버튼
  - seed 데모 데이터

## 주요 파일

- `src/components/app-shell.tsx`
- `src/components/signup-form.tsx`
- `src/components/login-form.tsx`
- `src/components/quote-create-form.tsx`
- `src/components/carrier-auction-board.tsx`
- `src/components/rate-benchmark-form.tsx`
- `src/components/rate-benchmark-import-form.tsx`
- `src/components/rate-benchmark-table.tsx`
- `src/components/shipment-followup-board.tsx`
- `src/lib/auth.ts`
- `src/lib/access-policy.ts`
- `src/lib/rate-benchmark.ts`
- `src/lib/rate-benchmark-input.ts`
- `src/lib/rate-benchmark-store.ts`
- `src/lib/rate-benchmark-sync.ts`
- `src/lib/api-contract.ts`
- `src/lib/shipment-workflow.ts`
- `src/lib/timeline.ts`
- `src/lib/domain.test.ts`
- `src/app/api/auth/*`
- `src/app/api/signup/*`
- `src/app/api/quotes/*`
- `src/app/api/pools/*`
- `src/app/api/auctions/*`
- `src/app/api/admin/*`
- `src/app/api/admin/rate-benchmarks/[id]/route.ts`
- `src/app/api/admin/rate-benchmarks/import/route.ts`
- `src/app/api/admin/rate-benchmarks/sync/route.ts`
- `src/app/api/admin/pools/[poolId]/shipment-status/route.ts`
- `src/app/api/cron/rate-benchmarks/route.ts`
- `src/app/api/cron/time-lock/route.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma/migrations/20260527093000_add_freight_rate_benchmarks/migration.sql`
- `README.md`

## 검증 명령

```powershell
npm run db:up
npm run prisma:migrate
npm run seed
npm run test
npm run build
npm run dev
```

현재 직접 실행에 사용했던 Node 경로:

```powershell
& 'C:\Users\white\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --import tsx --test src\lib\*.test.ts
& 'C:\Users\white\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\next\dist\bin\next build
```

## 주의 사항

- 3001 포트가 이미 사용 중이면 기존 Next 서버가 남아 있는 상태입니다.
- Git Bash에서는 다음처럼 종료할 수 있습니다.

```bash
taskkill //PID <PID> //F
```

- Prisma client 생성 중 `query_engine-windows.dll.node` rename `EPERM`이 날 수 있습니다. 보통 실행 중인 Next/Node 프로세스가 Prisma 엔진 파일을 잡고 있을 때 발생합니다.
- 그 경우 3001 개발 서버와 관련 Node 프로세스를 정리한 뒤 다시 실행하면 됩니다.
- 현재 운임 기준 조회는 새 Prisma client 생성이 막혀도 동작하도록 일부 구간에서 raw SQL을 사용합니다.

## 최근 추가 검증

- `npm run dev`로 열린 `http://localhost:3001` 기준 `/login`, `/dashboard` 응답을 확인했습니다.
- 데모 계정 4종으로 로그인 후 `/shipper`, `/forwarder`, `/carrier`, `/admin` 접근을 확인했습니다.
- 관리자 운임 기준 테스트 데이터를 생성한 뒤 `PATCH /api/admin/rate-benchmarks/[id]`, `DELETE /api/admin/rate-benchmarks/[id]` 동작을 확인했고 테스트 데이터는 삭제했습니다.
- CSV 파서 단위 테스트를 추가해 quoted label과 항로 코드 대문자 정규화를 확인했습니다.
- CSV 소스 설정 파서 단위 테스트를 추가했습니다.
- 3001 개발 서버 재시작 후 관리자 계정으로 CSV import API를 실제 호출했습니다.
  - `POST /api/admin/rate-benchmarks/import` → `201`, `{"imported":1,"status":"IMPORTED"}`
  - 테스트로 import한 운임 기준은 `DELETE /api/admin/rate-benchmarks/[id]`로 삭제했습니다.
- 낙찰 이후 운송 후속 관리와 API 요청 계약 테스트를 추가했습니다.
- `next build` 성공 및 테스트 `11 passed` 상태입니다.
- 3001 개발 서버 재시작 후 관리자 운임 동기화 기능을 실제 확인했습니다.
  - 관리자 로그인 → `200`
  - 관리자 화면 `운임 동기화` 버튼 렌더링 확인
  - `POST /api/admin/rate-benchmarks/sync` → `200`, `{"errors":[],"imported":0,"sources":0,...}`
  - `GET /api/cron/rate-benchmarks` 무인증 → `401`
  - `GET /api/cron/rate-benchmarks?secret=<CRON_SECRET>` → `200`, `{"errors":[],"imported":0,"sources":0,...}`
  - 로컬 `.env`에는 아직 실제 `RATE_BENCHMARK_CSV_SOURCES`가 없으므로 `sources: 0`, `imported: 0` 응답이 정상입니다.

## 2026-05-28 추가 진행

- 운임 기준 구조를 향후 유료 데이터 확장까지 비교 가능한 형태로 확장했습니다.
  - `RateBenchmarkSource`: `FBX`, `DREWRY_WCI`, `XENETA_SPOT`, `XENETA_CONTRACT`, `COMMERCIAL_API` 추가
  - `RateBenchmarkTier`: `PUBLIC`, `PARTNER`, `PAID`, `INTERNAL`, `LEGACY`
  - `RateBenchmarkType`: `MARKET_INDEX`, `SPOT_RATE`, `CONTRACT_RATE`, `FAK`, `PUBLIC_TARIFF`, `INTERNAL_MASTER`
  - `provider`, `externalRef`, `currency`, `confidenceScore` 추가
  - 기존 SCFI/FAK/공시/내부 기준도 legacy 비교 후보로 유지
- 새 마이그레이션을 적용했습니다.
  - `prisma/migrations/20260528090000_extend_rate_benchmark_sources/migration.sql`
- CSV import가 기존 7개 헤더와 새 확장 헤더를 모두 지원하도록 변경했습니다.
  - 새 권장 헤더: `source,sourceTier,benchmarkType,sourceLabel,provider,externalRef,polCode,podCode,containerGroup,rateUsd,confidenceScore,validFrom`
- 관리자 운임 기준 입력/수정 UI에 출처 등급, 기준 유형, 제공자, 외부 참조, 신뢰도를 추가했습니다.
- 운영 감사 로그를 실제 API에 연결했습니다.
  - 운임 기준 등록/수정/삭제/import/sync
  - 관리자 경매 시작/마감
  - 운송 후속 상태 전환
  - 관리자 타임락 배치 실행
- 관리자 화면에 최근 운영 감사 로그 패널을 추가했습니다.
- 관리자 업체 접근 제어를 추가했습니다.
  - 신규 가입자는 기존처럼 `PENDING_APPROVAL`로 생성
  - 관리자가 `/admin`에서 업체 계정을 `ACTIVE`, `RESTRICTED`, `SUSPENDED`로 전환 가능
  - 본인 관리자 계정 상태 변경은 차단
  - 사용자 상태 변경은 `USER_STATUS_UPDATE` 감사 로그로 기록
  - 승인되지 않았거나 제한/정지된 일반 계정은 견적 생성, 풀 생성/참여, 선사 입찰 API 사용 불가
- 업체 접근 제어를 사유 입력형 UI로 개선했습니다.
  - `/admin`의 업체 접근 제어 테이블에서 상태 선택과 사유 입력 후 저장
  - 상태 변경 사유는 `AuditLog.afterJson.reason`에 저장
  - 빠른 버튼식 변경 대신 사유 기반 변경으로 운영 설명 가능성 보강
- 업체 접근 제어 후속 UI를 추가했습니다.
  - 상태별 카운터: `PENDING_APPROVAL`, `ACTIVE`, `RESTRICTED`, `SUSPENDED`, `LOCKED`
  - 상태 필터 드롭다운
  - 승인 대기/제한/정지 업체를 빠르게 좁혀 볼 수 있음
- 운영 감사 로그 상세 보기를 추가했습니다.
  - 감사 로그 행의 상세 버튼으로 `beforeJson`/`afterJson` 비교 가능
  - 사용자 상태 변경 사유, 운임 기준 변경 전후, 배치 실행 결과 확인 가능
- 운영 감사 로그 요약 컬럼을 추가했습니다.
  - 사용자 상태 변경은 `reason`을 펼치기 전에도 바로 표시
  - 일반 변경은 주요 변경 필드를 `before -> after` 형태로 최대 3개 요약
  - import/sync/batch 실행 결과는 핵심 count를 요약
- 운영 감사 로그 필터를 추가했습니다.
  - 액션 필터: 예 `USER_STATUS_UPDATE`, `RATE_BENCHMARK_SYNC`
  - 대상 필터: 예 `User`, `FreightRateBenchmark`, `CoBuyPool`
  - 수행자 필터: 관리자/시스템 기준
- 출시 준비 체크리스트를 추가했습니다.
  - `docs/LAUNCH_CHECKLIST.md`
  - 내부 PoC/파일럿/정식 출시 기준 구분
  - 운영 환경변수, cron, seed/demo 분리, QA 항목 정리
- 출시 보안 기본값을 보강했습니다.
  - production에서 `AUTH_SECRET`/`NEXTAUTH_SECRET` fallback 제거
  - production에서 cron query string secret 기본 비활성화
  - `ALLOW_CRON_SECRET_QUERY=true`일 때만 query 방식 허용
  - `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false`로 데모 계정 UI 숨김 가능
- 완성도 개선을 추가했습니다.
  - 로그인 실패 코드를 한국어/영어 사용자 안내 문구로 변환
  - 승인 대기/제한/정지 일반 계정은 역할별 작업 UI 대신 계정 상태 안내만 표시
  - 운영 환경변수 템플릿 `.env.production.example` 추가
  - README에 운영 환경변수와 cron query secret 정책 반영
- 개발 서버와 production build 산출물이 충돌하지 않도록 `next.config.ts`에서 개발 환경 기본 `distDir`를 `.next-dev`로 분리했습니다.

## 2026-05-28 추가 검증

- DB 마이그레이션 상태: 최신
- 타입 검사: 통과
- 테스트: `12 passed`
- `next build`: 성공
- 실제 3001 서버:
  - `/login` 응답 확인
  - 관리자 로그인 `200`
  - `/admin` 응답 `200`
  - 운영 감사 로그 패널 렌더링 확인
  - `RATE_BENCHMARK_SYNC` 감사 로그 렌더링 확인
  - 업체 접근 제어 패널 렌더링 확인
  - 데모 화주 계정 `RESTRICTED → ACTIVE` 전환 API 확인 및 원상 복구
  - `USER_STATUS_UPDATE` 감사 로그 기록 확인
  - 상태 변경 사유 저장 확인: `Restore after smoke test`
  - 업체 접근 제어 필터/카운터 렌더링 확인
  - 운영 감사 로그 상세 버튼 렌더링 확인
  - 운영 감사 로그 요약 컬럼 및 사유 요약 렌더링 확인
  - 운영 감사 로그 액션/대상/수행자 필터 렌더링 확인
  - `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false`일 때 로그인 화면에서 데모 비밀번호 미노출 확인
  - cron query secret production 비활성 정책 단위 테스트 추가
  - 테스트 `14 passed`
  - 승인 대기 화주 계정으로 `/shipper` 접근 시 계정 상태 안내 렌더링 확인 후 `ACTIVE`로 원상 복구
- `prisma generate`는 실행 중인 Node/Prisma 엔진 파일 잠금으로 `EPERM`이 발생할 수 있습니다. 서버를 완전히 내린 뒤 실행하면 됩니다.

## 다음에 이어서 하기 좋은 작업

- 실제 SCFI/선사 FAK/공시 운임 CSV URL 또는 사내 파일 배포 경로 연결
- 운영 감사 로그 상세 보기/필터링 UI 추가
- 승인 대기 업체만 모아 보는 필터/카운터 추가
- 운영 감사 로그 상세 보기에서 변경값 diff 하이라이트 개선
- 감사 로그 기간 필터 및 페이지네이션
- 운영 배포 환경변수 실제 값 확정
- demo seed와 production bootstrap seed 분리
- 3001 개발 서버 재시작 후 `/admin`, `/shipper`, `/forwarder`, `/carrier` 운송 후속 관리 UI 실제 확인
- 관리자 운송 후속 상태 전환 API 실제 서버 검증
- 전체 화면을 실제 브라우저에서 3001로 열어 모바일/데스크톱 UI 확인
