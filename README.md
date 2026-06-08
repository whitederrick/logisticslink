# LogisticsLink

LogisticsLink는 해상, 항공, 내륙운송, 창고 서비스를 하나의 운영 체계로 연결하는 통합 물류 플랫폼입니다.

현재 활성 서비스는 **LogisticsLink Ocean**입니다. 화주와 포워더의 해상 운송 수요를 블라인드 공동구매 풀로 집계하고, 포워더 또는 선사를 대상으로 타임락 역경매를 진행한 뒤 낙찰과 운송 실행 상태까지 관리합니다.

## 제품 구조

| 계층 | 이름 | 현재 상태 |
| --- | --- | --- |
| 플랫폼 | LogisticsLink | 운영 기반 |
| 해상 서비스 | LogisticsLink Ocean | 활성 서비스 |
| 항공 서비스 | Air | 준비 중 |
| 내륙운송 서비스 | Inland Transport | 준비 중 |
| 창고 서비스 | Warehousing | 준비 중 |

플랫폼 및 서비스 명칭의 단일 코드 원천은 `src/lib/product.ts`입니다. 현재 견적과 공동구매 풀은 `serviceCode=logisticslink-ocean`으로 분리되어 이후 서비스 데이터와 섞이지 않습니다. 확장 원칙은 `docs/LOGISTICSLINK_ARCHITECTURE.md`를 따릅니다.

## 로컬 실행

Docker Desktop을 먼저 실행한 뒤 아래 순서로 진행합니다.

```bat
npm install
copy .env.example .env
npm run db:up
npm run prisma:migrate
npm run seed:scenario
npm run dev
```

기본 주소는 `http://localhost:3001`입니다.

Codex/OpenAI 데스크톱의 `Launch app` 버튼에서 `Unable to find Electron app` 오류가 나면 앱 코드가 아니라 Windows 앱 런처 연결 문제일 수 있습니다. 그때는 PowerShell 대신 아래 CMD 스크립트로 서버를 직접 실행한 뒤 브라우저에서 `http://localhost:3001`을 엽니다.

```bat
scripts\launch-dev.cmd
```

## 운영 환경

운영 배포 환경변수는 `.env.production.example`을 기준으로 준비합니다.

운영 기본값:

- `AUTH_COOKIE_SECURE=true`
- `ALLOW_CRON_SECRET_QUERY=false`
- `NEXT_PUBLIC_ENABLE_SCENARIO_LOGIN=false`
- `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false`는 legacy 호환 플래그이며, 운영에서는 제거하거나 `false`로 둡니다.

운영 bootstrap은 시나리오 계정과 샘플 풀을 만들지 않는 `npm run seed` 또는 `npm run seed:bootstrap`을 사용합니다. 로컬 및 리허설 환경에서만 `npm run seed:scenario`를 실행합니다.

배포 전 검증:

```bat
npm run env:check
npm run rate-sources:check
npm run test
npm run build
```

`env:check`는 placeholder secret, HTTP 운영 URL, insecure cookie, cron query secret 허용, 시나리오 로그인 노출, 라벨 없는 운임 CSV URL, HTTPS가 아닌 운임 CSV URL을 차단합니다. `rate-sources:check`는 설정된 SCFI, 선사 FAK, 공시 운임 CSV를 실제로 가져와 파싱 가능한지 확인합니다.

## 시나리오 계정

로컬 및 리허설 환경에서 운영 흐름을 검증하기 위한 계정입니다. 모든 시나리오 계정의 비밀번호는 `LogisticsLink!123`입니다.

| 역할 | 이메일 | 화면 |
| --- | --- | --- |
| 화주 | `shipper@logisticslink.co.kr` | `/shipper` |
| 포워더 | `forwarder@logisticslink.co.kr` | `/forwarder` |
| 선사 | `carrier@logisticslink.co.kr` | `/carrier` |
| 운영자 | `admin@logisticslink.co.kr` | `/admin` |

## 실제 사용 시나리오

운영 흐름은 `docs/SERVICE_OPERATING_SCENARIOS.md`에 정리되어 있습니다.

핵심 흐름:

1. 기업이 가입하고 사업자 정보 검토를 거쳐 역할별 권한을 받습니다.
2. 화주 또는 포워더가 항로, ETD, 화물, 컨테이너, 수량, 중량 기준으로 운송 수요를 등록합니다.
3. 조건이 맞는 수요는 참여 기업 정보를 숨긴 채 블라인드 공동구매 풀로 집계됩니다.
4. D-14 타임락이 열리면 선사는 운임 기준 상한 아래에서 입찰합니다.
5. 운영자는 최저 유효 입찰을 낙찰로 확정합니다.
6. 낙찰 건은 계약, 운송 중, 완료, 실패, 분쟁 상태로 후속 관리됩니다.

## 역할별 화면

- `/dashboard`: 전체 운영 파이프라인과 서비스 운영 흐름
- `/login`: 시나리오 계정 또는 등록된 기업 계정 로그인
- `/signup`: 기업 회원가입, 중복 체크, 약관 동의
- `/shipper`: 화물 수요 등록, 내 견적, 추천 공동구매 풀 참여, 운송 상태 확인
- `/forwarder`: 고객 화물 등록, 공동구매 현황, 운송 상태 확인
- `/carrier`: 실시간 역경매 보드, 입찰 저장, 낙찰 운송 현황
- `/admin`: 전체 풀, 참여자, 입찰, 타임락 배치, 운임 기준 데이터, 운송 상태 관리

## 운임 기준 데이터

역경매 상한가는 단일 SCFI 값만 보지 않고, 수집 가능한 여러 운임 기준을 함께 비교합니다.

- SCFI 또는 SCFI proxy
- Freightos FBX, Drewry WCI 같은 공개/상용 시장 지수
- 선사 FAK 운임
- 선사 웹페이지 공시 운임
- Xeneta 같은 유료 스팟/계약 운임 벤치마크
- LogisticsLink Ocean 내부 기준 운임 마스터

CSV import 헤더 예시:

```csv
source,sourceTier,benchmarkType,sourceLabel,provider,externalRef,polCode,podCode,containerGroup,rateUsd,confidenceScore,validFrom
SCFI,PUBLIC,MARKET_INDEX,SCFI Korea-USWC proxy,Shanghai Shipping Exchange,scfi-20260528,KRPUS,USLGB,DRY,3180,70,2026-05-28
XENETA_CONTRACT,PAID,CONTRACT_RATE,Xeneta contract benchmark,Xeneta,contract-krpus-uslgb,KRPUS,USLGB,DRY,3090,92,2026-05-28
```

## Cron

운영 환경에서는 bearer token 방식만 사용합니다.

```http
GET /api/cron/time-lock
Authorization: Bearer <CRON_SECRET>
```

```http
GET /api/cron/rate-benchmarks
Authorization: Bearer <CRON_SECRET>
```

로컬 개발에서만 query string secret을 허용할 수 있습니다.

```text
ALLOW_CRON_SECRET_QUERY="true"
```

## 주요 명령

- `npm run db:up`: PostgreSQL 시작
- `npm run db:down`: 데이터 유지 후 PostgreSQL 중지
- `npm run db:reset`: PostgreSQL 볼륨 삭제 후 재시작
- `npm run prisma:migrate`: 개발 DB에 마이그레이션 적용
- `npm run prisma:deploy`: 준비된 마이그레이션을 비대화형으로 적용
- `npm run seed`: 운영 bootstrap용 주요 포트 데이터 적재
- `npm run seed:bootstrap`: 운영 bootstrap용 주요 포트와 선택적 첫 운영자 적재
- `npm run seed:scenario`: 로컬/리허설용 포트, 시나리오 계정, 운임 기준, 풀/입찰 데이터 적재
- `npm run seed:demo`: legacy alias, `seed:scenario`와 동일
- `npm run env:check`: 운영 환경변수와 운임 CSV 설정 검증
- `npm run rate-sources:check`: 운임 CSV URL fetch 및 파싱 검증
- `npm run test`: 도메인 테스트 실행
- `npm run build`: Prisma Client 생성과 Next production build 실행

## 로컬 DB

기본 PostgreSQL 연결 정보:

```text
postgresql://logisticslink:logisticslink@localhost:5433/logisticslink?schema=public
```

새 로그인 쿠키는 `logisticslink_session`을 사용하며, 전환 기간에는 `logisticslink_legacy_session`도 읽고 로그아웃 시 함께 제거합니다.

해상 서비스 기준 문서는 `docs/LOGISTICSLINK_DEVELOPMENT_PRD.md`, 플랫폼 확장 원칙은 `docs/LOGISTICSLINK_ARCHITECTURE.md`에 있습니다.
