# LogisticsLink

LogisticsLink는 해상, 항공, 내륙운송, 창고 서비스를 하나의 운영 체계로 연결하기 위한 통합 물류 플랫폼입니다.

현재 구현된 첫 번째 서비스는 **ForwardLink Ocean**입니다. 화주와 포워더의 해상 화물을 블라인드 공동구매 풀로 모은 뒤, 포워더 또는 선사를 대상으로 역경매를 진행합니다.

## 제품 구조

| 계층 | 이름 | 현재 상태 |
| --- | --- | --- |
| 플랫폼 | LogisticsLink | 운영 기반 |
| 해상 서비스 | ForwardLink Ocean | MVP 운영 |
| 항공 서비스 | Air | 계획 |
| 내륙운송 서비스 | Inland Transport | 계획 |
| 창고 서비스 | Warehousing | 계획 |

플랫폼 및 서비스 명칭의 단일 코드 원천은 `src/lib/product.ts`입니다. 현재 견적과 공동구매 풀은 `serviceCode=forwardlink-ocean`으로 분리되어 이후 서비스 데이터와 섞이지 않습니다. 확장 원칙은 `docs/LOGISTICSLINK_ARCHITECTURE.md`를 따릅니다.

## 로컬 실행

Docker Desktop을 먼저 실행한 뒤 아래 순서로 진행합니다.

```bat
npm install
copy .env.example .env
npm run db:up
npm run prisma:migrate
npm run seed:demo
npm run dev
```

기본 주소는 `http://localhost:3001`입니다.

Codex/OpenAI 데스크톱의 `Launch app` 버튼에서 `Unable to find Electron app` 오류가 나면 앱 코드가 아니라 Windows 앱 런처 연결 문제일 수 있습니다. 그때는 PowerShell 대신 아래 CMD 스크립트로 서버를 직접 실행한 뒤 브라우저에서 `http://localhost:3001`을 엽니다.

```bat
scripts\launch-dev.cmd
```

운영 배포 환경변수는 `.env.production.example`을 기준으로 준비합니다. 운영에서는 `AUTH_COOKIE_SECURE=true`, `ALLOW_CRON_SECRET_QUERY=false`, `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false`를 사용합니다.

운영 bootstrap은 데모 계정과 샘플 풀을 만들지 않는 `npm run seed` 또는 `npm run seed:bootstrap`을 사용합니다. 로컬 데모 환경에서만 `npm run seed:demo`를 실행합니다.

운영 배포 전에는 실제 값이 주입된 환경에서 아래 검사를 실행합니다.

```bat
npm run env:check
npm run rate-sources:check
```

`env:check`는 placeholder secret, HTTP 운영 URL, insecure cookie, cron query secret 허용, 데모 로그인 노출, 라벨 없는 운임 CSV URL, HTTPS가 아닌 운임 CSV URL을 차단합니다. `rate-sources:check`는 설정된 SCFI/선사 FAK/공시 운임 CSV를 실제로 가져와 파싱 가능한지 확인합니다.

`3001` 포트가 이미 사용 중이면 기존 Next 서버가 남아 있는 상태입니다. Git Bash에서는 다음처럼 종료할 수 있습니다.

```bash
taskkill //PID <PID> //F
```

## 데모 계정

모든 데모 계정의 비밀번호는 `ForwardLink!123`입니다.

| 역할 | 이메일 | 화면 |
| --- | --- | --- |
| 화주 | `shipper@forward-link.co.kr` | `/shipper` |
| 포워더 | `forwarder@forward-link.co.kr` | `/forwarder` |
| 선사 | `carrier@forward-link.co.kr` | `/carrier` |
| 관리자 | `admin@forward-link.co.kr` | `/admin` |

## 핵심 흐름

1. 화주 또는 포워더가 운송 수요를 등록합니다.
2. 조건이 맞는 화물을 블라인드 공동구매 풀로 집계합니다.
3. D-14 타임락이 열리면 풀이 역경매 상태로 전환됩니다.
4. 선사는 화주 신원 없이 집계 물량, 항로, 운임 기준만 보고 입찰합니다.
5. D-7 이후 최저 유효 입찰을 낙찰로 확정합니다.
6. 낙찰 이후 운송 후속 상태를 추적합니다.

## 역할별 화면

- `/dashboard`: 전체 운영 파이프라인과 남은 절차
- `/login`: 데모 계정 또는 기업 계정 로그인
- `/signup`: 기업 회원가입, 중복 체크, 약관 스크롤 동의
- `/shipper`: 화물 등록, 내 견적, 추천 공동구매 풀 참여, 운송 후속 상태 확인
- `/forwarder`: 포워더 계정의 고객 화물 등록, 공동구매 현황, 운송 후속 상태 확인
- `/carrier`: polling 기반 실시간 역경매 보드, 최저가/입찰 수 갱신, 입찰 원장, 낙찰 운송 현황
- `/admin`: 전체 풀, 참여자, 입찰, 타임락 배치, 운임 기준 데이터 관리, 운송 후속 상태 전환

## 운임 기준 데이터

역경매 상한가는 단일 SCFI 값만 보지 않고, 수집 가능한 여러 운임 기준을 함께 비교합니다.

- SCFI 또는 SCFI proxy
- Freightos FBX, Drewry WCI 같은 공개/상용 시장 지수
- 선사 FAK 운임
- 선사 홈페이지 공시 운임
- Xeneta 같은 유료 스팟/계약 운임 벤치마크
- ForwardLink Ocean 내부 기준 운임 마스터

운임 기준은 출처뿐 아니라 `sourceTier`와 `benchmarkType`으로 비교 축을 유지합니다. 예를 들어 기존 SCFI/FAK/공시 운임은 계속 남겨두고, 나중에 유료 계약 운임이 들어와도 같은 항로와 컨테이너 그룹에서 공개 지수, 파트너 자료, 유료 데이터, 내부 기준을 나란히 비교할 수 있습니다.

현재 로직은 항로와 컨테이너 그룹에 맞는 기준 운임 중 가장 낮은 값을 입찰 상한가로 적용합니다. DB에 운임 기준이 있어도 내장 legacy 기준은 비교 후보로 유지되며, 관리자 화면에서 운임 기준을 직접 등록, 수정, 삭제하거나 CSV로 일괄 가져올 수 있고, 선사 역경매 보드에서는 적용 상한가와 기준 운임 목록을 함께 확인합니다.

CSV import 헤더는 다음 순서를 권장합니다.

```csv
source,sourceTier,benchmarkType,sourceLabel,provider,externalRef,polCode,podCode,containerGroup,rateUsd,confidenceScore,validFrom
SCFI,PUBLIC,MARKET_INDEX,SCFI Korea-USWC proxy,Shanghai Shipping Exchange,scfi-20260528,KRPUS,USLGB,DRY,3180,70,2026-05-28
XENETA_CONTRACT,PAID,CONTRACT_RATE,Xeneta contract benchmark,Xeneta,contract-krpus-uslgb,KRPUS,USLGB,DRY,3090,92,2026-05-28
```

기존 7개 헤더 형식(`source,sourceLabel,polCode,podCode,containerGroup,rateUsd,validFrom`)도 계속 import할 수 있습니다. 생략된 비교 메타데이터는 공개 시장 지수 기준 기본값으로 보정됩니다.

## 타임락 자동화

관리자 화면의 `배치 실행` 버튼은 수동 실행용입니다. 배포 환경에서는 cron 또는 스케줄러가 아래 엔드포인트를 호출하면 됩니다.

```http
GET /api/cron/time-lock
Authorization: Bearer <CRON_SECRET>
```

로컬 개발에서는 쿼리 파라미터 방식도 지원합니다. 운영에서는 `ALLOW_CRON_SECRET_QUERY=true`를 명시하지 않는 한 query string secret을 받지 않습니다.

```text
/api/cron/time-lock?secret=<CRON_SECRET>
```

로컬 `.env`에는 다음 값이 필요합니다.

```text
CRON_SECRET="replace-with-a-cron-secret"
AUTH_COOKIE_SECURE="false"
ALLOW_CRON_SECRET_QUERY="true"
NEXT_PUBLIC_ENABLE_DEMO_LOGIN="true"
RATE_BENCHMARK_CSV_SOURCES="SCFI=https://example.com/scfi.csv;CARRIER_FAK=https://example.com/carrier-fak.csv"
```

운영 HTTPS 환경에서는 `AUTH_COOKIE_SECURE="true"`로 설정합니다.

운임 기준 CSV 소스는 세미콜론으로 여러 개를 연결합니다. 각 항목은 `라벨=CSV_URL` 형식이며, 스케줄러는 아래 엔드포인트를 호출하면 됩니다.

```http
GET /api/cron/rate-benchmarks
Authorization: Bearer <CRON_SECRET>
```

## API 목록

- `POST /api/auth/login`: 로그인 및 세션 쿠키 발급
- `POST /api/auth/logout`: 로그아웃
- `POST /api/signup`: 회원가입 요청
- `POST /api/signup/check`: 이메일/사업자번호 중복 확인
- `POST /api/quotes`: 화주/포워더 견적 생성
- `GET /api/quotes/[id]/recommended-pools`: 견적 기준 추천 공동구매 풀
- `POST /api/pools`: 견적 기반 공동구매 풀 생성
- `POST /api/pools/[poolId]/join`: 추천 풀 참여
- `GET /api/auctions/live`: 선사 실시간 역경매 보드 데이터
- `POST /api/auctions/[poolId]/bids`: 선사 입찰
- `POST /api/admin/rate-benchmarks`: 관리자 운임 기준 등록/갱신
- `PATCH /api/admin/rate-benchmarks/[id]`: 관리자 운임 기준 수정
- `DELETE /api/admin/rate-benchmarks/[id]`: 관리자 운임 기준 삭제
- `POST /api/admin/rate-benchmarks/import`: 관리자 운임 기준 CSV import
- `POST /api/admin/rate-benchmarks/sync`: 관리자 수동 운임 기준 CSV 소스 동기화
- `POST /api/admin/time-lock/run`: 관리자 수동 타임락 배치
- `POST /api/admin/pools/[poolId]/start-auction`: 관리자 경매 시작
- `POST /api/admin/pools/[poolId]/close-auction`: 관리자 경매 마감
- `PATCH /api/admin/pools/[poolId]/shipment-status`: 관리자 운송 후속 상태 전환
- `GET /api/cron/time-lock`: 스케줄러용 타임락 배치
- `GET /api/cron/rate-benchmarks`: 스케줄러용 운임 기준 CSV 소스 동기화

## 검증

```bat
npm run test
npm run build
```

현재 테스트는 타임락 계산, 풀 매칭, 물량 계산, 입찰 검증, 멀티 운임 기준 상한가 산출, CSV 파싱, 운송 후속 상태 전환, API 요청 계약을 검증합니다.

## 로컬 DB

기본 PostgreSQL 연결 정보는 다음과 같습니다.

```text
postgresql://forwardlink:forwardlink@localhost:5433/forwardlink?schema=public
```

DB명, DB 사용자명, 기존 데모 이메일과 데모 비밀번호는 기존 로컬 데이터 및 배포 호환성을 위해 당분간 유지합니다. 이 값들은 고객에게 보이는 브랜드명이 아닙니다. 새 로그인 쿠키는 `logisticslink_session`을 사용하며, 전환 기간에는 기존 `forwardlink_session`도 읽고 로그아웃 시 함께 제거합니다.

자주 쓰는 명령:

- `npm run db:up`: PostgreSQL 시작
- `npm run db:down`: 데이터 유지 후 PostgreSQL 중지
- `npm run db:reset`: PostgreSQL 볼륨 삭제 후 재시작
- `npm run prisma:migrate`: 마이그레이션 적용
- `npm run prisma:deploy`: 기존 DB에 준비된 마이그레이션을 비대화형으로 적용
- `npm run seed`: 운영 bootstrap용 주요 포트 데이터 적재
- `npm run seed:demo`: 로컬 데모용 포트, 데모 계정, 운임 기준, 샘플 풀/입찰 데이터 적재
- `npm run env:check`: 운영 환경변수와 운임 CSV 소스 설정 검증
- `npm run rate-sources:check`: 운영 운임 CSV URL fetch 및 파싱 검증

해상 서비스 PRD는 `docs/ForwardLink_Development_PRD.md`, 플랫폼 확장 원칙은 `docs/LOGISTICSLINK_ARCHITECTURE.md`에 있습니다.
