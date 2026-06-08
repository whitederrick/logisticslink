# Vercel 배포 가이드 (Step 6)

> **상태**: 🟡 사용자 실행 대기
> **이전 단계**: git push 완료 (`779159a`)
> **작업 일자**: 2026-06-07

---

## 0. TL;DR

`git push origin main`이 성공했으므로, **Vercel GitHub 연동이 설정되어 있다면 자동 배포가 진행**됩니다. 별도 명령 없이도 Vercel 대시보드에서 배포 상태를 확인할 수 있습니다.

만약 자동 배포가 설정되지 않았다면, 아래 두 옵션 중 하나를 선택해 진행합니다.

---

## 1. Option A: Vercel GitHub 연동 자동 배포 (권장)

### 1.1 Vercel 대시보드에서 확인

1. https://vercel.com/dashboard 접속
2. `logisticslink` 프로젝트 선택
3. **Settings** → **Git** 메뉴에서 다음 확인:
   - **Production Branch**: `main` ✅
   - **Connected Git Repository**: `whitederrick/logisticslink` ✅
4. **Deployments** 탭에서 최근 배포 상태 확인
   - `779159a feat(schema): A2 + A3 migrations + docs` 커밋이 배포 중/완료 상태로 표시되어야 함

### 1.2 자동 배포가 이미 시작된 경우

- 배포가 시작되면 Vercel 대시보드의 **Deployments** 탭에서 진행 상황을 실시간으로 볼 수 있습니다.
- 빌드 로그를 클릭하여 상세 내역 확인 가능.

### 1.3 자동 배포가 안 되는 경우

다음 두 가지 중 하나:
- **Vercel이 GitHub 저장소를 처음 import**하는 경우: https://vercel.com/new 접속 → "Import Git Repository" 선택 → `whitederrick/logisticslink` 선택 → 환경 변수 설정 후 Deploy.
- **이미 import되었는데 자동 배포가 안 됨**: Vercel 대시보드 → Settings → Git → "Redeploy" 클릭.

---

## 2. Option B: Vercel CLI 수동 배포 (자동 배포가 안 될 때)

### 2.1 Vercel CLI 설치

```bash
npm install -g vercel
vercel --version
```

### 2.2 Vercel 로그인

```bash
# 브라우저 로그인 (권장)
vercel login

# 또는 환경 변수로 토큰 사용
# https://vercel.com/account/tokens 에서 토큰 생성 후:
set VERCEL_TOKEN=your_token_here  # Windows cmd
# 또는
export VERCEL_TOKEN=your_token_here  # bash
```

### 2.3 프로젝트 연결 (최초 1회)

```bash
cd c:/myProjects/logisticslink
vercel link
```

### 2.4 프로덕션 배포

```bash
# 프로덕션 배포 (production 환경)
vercel --prod --yes

# 또는 (preview 환경)
vercel --yes
```

---

## 3. Vercel 환경 변수 (필수 설정)

Vercel 대시보드 → **Settings** → **Environment Variables**에서 다음 변수를 모두 설정해야 합니다.

### 3.1 데이터베이스

| 변수 | 값 (예시) | 환경 |
|------|----------|------|
| `DATABASE_URL` | `postgresql://user:pass@host:port/db?sslmode=require` | Production, Preview, Development |

> **중요**: Vercel Postgres / Neon / Supabase 등 managed PostgreSQL 사용 권장. 로컬 `localhost:5433`은 Vercel에서 접근 불가.

### 3.2 인증 / 보안

| 변수 | 값 | 환경 |
|------|---|------|
| `AUTH_COOKIE_SECURE` | `true` | Production |
| `AUTH_COOKIE_SECURE` | `false` | Preview, Development |
| `AUTH_SECRET` | (32자 이상 랜덤 문자열) | All |
| `NEXTAUTH_SECRET` | (위와 동일) | All |
| `NEXTAUTH_URL` | `https://logisticslink.vercel.app` | Production |

### 3.3 데모 / 운영

| 변수 | 값 | 환경 |
|------|---|------|
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` | `false` | Production |
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` | `true` | Preview, Development |
| `CRON_SECRET` | (랜덤 문자열) | Production |

### 3.4 외부 API (해당 시)

| 변수 | 용도 |
|------|------|
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | 결제 |
| `SCFI_API_KEY` | 운임 지수 |
| `SENDGRID_API_KEY` | 이메일 |
| 기타 | (프로젝트별) |

---

## 4. Vercel 빌드 설정

Vercel 대시보드 → **Settings** → **General** → **Build & Development Settings**:

| 항목 | 값 |
|------|---|
| **Framework Preset** | `Next.js` |
| **Build Command** | `prisma generate && next build` |
| **Output Directory** | `.next` (Next.js 기본값) |
| **Install Command** | `npm install` |
| **Node.js Version** | 22.x (LTS) |

> **중요**: `prisma migrate deploy`는 Vercel build command에 넣지 않습니다. Neon advisory lock이 잠깐 잡히면 앱 빌드까지 실패할 수 있으므로, 프로덕션 마이그레이션은 배포 전후에 `npm run prisma:deploy`로 별도 실행합니다.

---

## 5. 배포 후 검증

### 5.1 Vercel 대시보드에서 확인

- Deployments → 최신 배포가 "Ready" 상태인지 확인
- 빌드 로그에서 다음 확인:
  - `✔ Generated Prisma Client` 성공
  - `✔ All migrations have been successfully applied` (A2 + A3)
  - `Compiled successfully` (Next.js 빌드 성공)

### 5.2 프로덕션 URL 접속 테스트

```
https://logisticslink.vercel.app
```

- 메인 페이지 렌더링 확인
- 화주/선사/포워더 로그인 페이지 동작 확인
- (KYC 인증 후) 풀 목록 조회 시 새 스키마(cargoCategoryCode) 정상 노출 확인

### 5.3 데이터베이스 검증

Vercel 대시보드에서 Postgres (또는 외부 관리) 콘솔로 접속:

```sql
-- 새 테이블 확인
SELECT COUNT(*) FROM "CargoCategory";    -- 13
SELECT COUNT(*) FROM "CargoSubType";     -- 0
SELECT COUNT(*) FROM "KycProfile";       -- 0
SELECT COUNT(*) FROM "TrustScore";       -- 0
SELECT COUNT(*) FROM "PoolExtension";    -- 0
SELECT COUNT(*) FROM "Deposit";          -- 0

-- PoolStatus enum 확인 (10개 값)
SELECT unnest(enum_range(NULL::"PoolStatus"));

-- 기존 Quote/CoBuyPool의 cargoCategoryCode 백필 확인
SELECT
  (SELECT COUNT(*) FROM "Quote" WHERE "cargoCategoryCode" IS NOT NULL) AS quote_backfilled,
  (SELECT COUNT(*) FROM "CoBuyPool" WHERE "cargoCategoryCode" IS NOT NULL) AS pool_backfilled;
```

---

## 6. 문제 해결

### 6.1 빌드 실패: `prisma migrate deploy` 오류

- DATABASE_URL이 올바른지 확인
- Vercel Postgres / Neon의 경우 connection string 끝에 `?sslmode=require` 필요
- 마이그레이션이 직접 실행 불가능한 경우, Vercel Postgres 콘솔에서 SQL 수동 실행 후 `prisma migrate resolve --applied <migration_name>`

### 6.2 빌드 실패: `prisma generate` 오류

- `prisma/schema.prisma` 파일이 git에 포함되어 있는지 확인
- `DATABASE_URL` 빌드 시점에는 사용되지 않으므로, 빌드 환경 변수에 더미 값으로 `postgresql://dummy@localhost:5432/dummy` 설정 가능

### 6.3 런타임 오류: "Cannot find module @prisma/client"

- Vercel 대시보드 → Settings → Functions → Node.js Version: 22.x
- `package.json`에 `"engines": { "node": "22.x" }` 추가 고려

---

## 7. Vercel 환경 권장 사항

### 7.1 Vercel Postgres (권장)

- Vercel 대시보드 → Storage → Create Database → Postgres
- 자동으로 DATABASE_URL 환경 변수 설정됨
- 무료 티어 제공 (Hobby 플랜)

### 7.2 도메인 연결

- Vercel 대시보드 → Settings → Domains
- 커스텀 도메인 (예: `logisticslink.com`) 연결 시 DNS 설정 필요

### 7.3 모니터링

- Vercel 대시보드 → Observability → Logs, Analytics
- 또는 외부 모니터링 도구 (Sentry, Datadog 등) 연동

---

## 8. 후속 작업

- [ ] Vercel 대시보드 접속 → 배포 상태 확인
- [ ] 환경 변수 모두 설정
- [ ] 프로덕션 URL 기능 테스트
- [ ] 데이터베이스 검증 쿼리 실행
- [ ] (선택) 커스텀 도메인 연결
- [ ] (선택) 모니터링/알림 설정

---

## 9. 참고 자료

- Vercel 문서: https://vercel.com/docs
- Next.js 배포 가이드: https://nextjs.org/docs/deployment
- Prisma + Vercel: https://www.prisma.io/docs/orm/more/deployment/vercel-serverless
- 자동 배포 트리거: `main` 브랜치에 push 시 자동 (GitHub App 연동 시)
