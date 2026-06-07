# Chat Handoff — 2026-06-07: Admin Bootstrap + Terms Agreement Fix

## TL;DR
운영 Neon DB에 ADMIN이 한 명도 없어 신규 가입자가 `PENDING_APPROVAL`에서 빠져나오지 못하던 문제를 **첫 가입자 자동 부트스트랩 패턴**으로 해결했다. 추가로 발견된 **약관 동의 체크박스 잠금 버그**도 함께 수정해 두 번에 걸쳐 Vercel 프로덕션에 배포했다. 두 커밋 모두 main에 머지됨. 사용자(ahn-namkyu)는 페이지 강제 새로고침 후 가입 → ADMIN 자동 승격 → `/admin` 진입까지 검증 필요.

## 컨텍스트 (코덱스에서 인계받은 마지막 상태)
- 배포 + 헬스체크는 정상
- 운영 DB의 QA 테스트 계정(`qa.logisticslink+1780810003184@example.com`)은 코덱스 안내로 사용자가 Neon SQL Editor에서 삭제 완료
- 사용자는 직접 회원가입을 시도. 그러나 `PENDING_APPROVAL`로 생성되어 `isOperationalUser` 게이트에 막혀 운영 페이지 진입 불가
- 결정: **런타임 부트스트랩 (첫 가입자 = ADMIN/ACTIVE)** + 시드 측 부트스트랩 옵션도 함께 추가

## 변경한 파일 (총 7개, 두 커밋에 걸쳐)

### 커밋 1: `60bae6e` — feat(signup): bootstrap first user as ADMIN when no admin exists
| # | 파일 | 종류 | 역할 |
| --- | --- | --- | --- |
| 1 | `src/lib/signup-bootstrap.ts` | **신규** | `getSignupBootstrapStatus()` (DB count) + `resolveSignupInitialState()` (순수 함수) |
| 2 | `src/app/api/signup/bootstrap/route.ts` | **신규** | `GET /api/signup/bootstrap` — 폼 마운트 시 부트스트랩 필요 여부 반환 |
| 3 | `src/app/api/signup/route.ts` | **수정** | `$transaction` 안에서 count+create 묶음. 부트스트랩 시 role/status 오버라이드 + `AuditLog(FIRST_ADMIN_BOOTSTRAP)` 기록 |
| 4 | `src/components/signup-form.tsx` | **수정** | 마운트 시 bootstrap 상태 조회 → `BootstrapBanner` 표시, 부트스트랩 적용 시 다른 성공 메시지 |
| 5 | `prisma/seed-bootstrap.ts` | **수정** | `BOOTSTRAP_ADMIN_*` 환경변수 시 첫 어드민 시드 (CI/CD용 옵션, 멱등성 보장) |
| 6 | `src/lib/domain.test.ts` | **수정** | `resolveSignupInitialState` 3개 시나리오 테스트 추가 (총 17→20) |
| 7 | `README.md` | **수정** | "첫 가입자 부트스트랩" 섹션 추가 |

### 커밋 2: `75241df` — fix(signup): auto-unlock terms agreement when content fits container
| # | 파일 | 종류 | 역할 |
| --- | --- | --- | --- |
| 1 | `src/components/signup-form.tsx` | **수정** | `useRef`+`useEffect`+`ResizeObserver`로 약관 컨테이너 크기/콘텐츠 변화 감시. 스크롤이 필요 없거나 이미 끝까지 읽은 상태면 `termsScrolled`를 즉시 `true`로 자동 설정 |

## Git 상태
```
main
├── 75241df (HEAD -> main, origin/main) fix(signup): auto-unlock terms agreement when content fits container
├── 60bae6e (origin/feat/signup-bootstrap-admin, feat/signup-bootstrap-admin) feat(signup): bootstrap first user as ADMIN when no admin exists
└── d062324 Seed core ocean ports

원격: https://github.com/whitederrick/logisticslink.git
```
- 부트스트랩 PR: https://github.com/whitederrick/logisticslink/pull/new/feat/signup-bootstrap-admin (닫지 않음, 참고용)
- 핫픽스는 main에 직접 머지

## Vercel 배포 상태
- 프로젝트: https://vercel.com/ahn-namkyus-projects/logisticslink
- 프로덕션 도메인: https://logisticslink.vercel.app
- `60bae6e` (부트스트랩) → Ready (38초)
- `75241df` (약관 핫픽스) → 배포 트리거됨 (Vercel ID: `icn1::iad1::6ff4c-1780828698703-6c514ba493d6`)

## 운영 도메인 라이브 검증 결과 (방금 curl로 확인)
| 엔드포인트 | 응답 | 상태 |
| --- | --- | --- |
| `GET /api/signup/bootstrap` | `{"adminCount":0,"needsBootstrap":true}` | HTTP 200 |
| `GET /api/health` | `{"ok":true,"platform":"LogisticsLink","service":"forwardlink-ocean"}` | HTTP 200 |
| `GET /signup` | HTML 페이지 | HTTP 200 |

부트스트랩 상태(ADMIN 0명)는 변하지 않음. 사용자가 첫 가입을 완료하면 `adminCount`가 1로 올라가고, `/api/signup/bootstrap`이 `needsBootstrap: false`를 반환하게 됨.

## 핵심 안전장치
- **트랜잭션 race 방지**: `prisma.$transaction` 안에서 `count({role:ADMIN}) + create`를 묶음. 두 명이 동시 가입해도 한 명만 ADMIN.
- **감사 로그**: 부트스트랩 발동 시 `AuditLog.action = 'FIRST_ADMIN_BOOTSTRAP'` 영구 기록. 시드 경로는 `'BOOTSTRAP_ADMIN_SEED'`.
- **멱등성**: ADMIN이 이미 존재하면 어떤 부트스트랩도 발동 안 함. 이메일 중복도 체크.
- **다중 서비스 호환**: `serviceCode`와 무관한 플랫폼 레이어 → Air/Inland/Warehouse 추가 시 그대로 동작.
- **약관 동의 잠금 해제**: `ResizeObserver`로 텍스트가 컨테이너 안에 들어가는 경우(ko/en 모두 해당)도 자동 처리. 텍스트가 길면 사용자 스크롤로도 잠금 해제 가능(이중 안전망).

## 사용자(ahn-namkyu) 다음 단계
1. 브라우저에서 `Ctrl+Shift+R` (또는 `Cmd+Shift+R`) 강제 새로고침
2. https://logisticslink.vercel.app/signup?lang=ko 접속
3. 노란색 "첫 번째 운영자 부트스트랩" 배너 확인
4. 실제 정보로 가입 → "약관에 동의합니다" 체크박스가 **스크롤 없이도** 활성화되어 있어야 함
5. 가입 성공 시 초록색 "첫 번째 관리자(ADMIN)로 즉시 로그인..." 메시지
6. /login으로 로그인 → 자동으로 /admin?lang=ko 이동
7. (선택) Neon SQL Editor에서 검증:
   ```sql
   SELECT "id","email","role","status" FROM "User" WHERE "email"='본인가입이메일';
   -- 기대: role='ADMIN', status='ACTIVE'
   
   SELECT "action","entityType" FROM "AuditLog" 
   WHERE "action"='FIRST_ADMIN_BOOTSTRAP' ORDER BY "id" DESC LIMIT 1;
   -- 기대: 1건
   ```

## 후속 추천 작업 (사용자 요청 시)
- **이메일 도메인 화이트리스트**: 부트스트랩 가능 이메일을 사전 승인된 도메인으로 제한
- **Vercel prebuild에 `npm run env:check` 추가**: 환경변수 회귀 방지
- **GitHub branch protection rules**: main 직접 push 차단, 필수 리뷰어 + CI 체크
- **신규 가입자 알림 자동화**: ADMIN 가입 시 기존 어드민에게 이메일/슬랙 알