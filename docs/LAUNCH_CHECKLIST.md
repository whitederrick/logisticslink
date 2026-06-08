# LogisticsLink / LogisticsLink Ocean Launch Checklist

최종 갱신: 2026-06-07

## 브랜드 및 인프라 전환

- [x] 애플리케이션 플랫폼명을 `LogisticsLink`로 변경
- [x] 기존 해상 MVP를 `LogisticsLink Ocean` 서비스로 분리
- [x] `Quote`와 `CoBuyPool`에 `serviceCode=logisticslink-ocean` 적용
- [x] 로컬 PostgreSQL에 `20260607090000_add_service_boundaries` 마이그레이션 적용
- [ ] GitHub 저장소명을 `whitederrick/logisticslink`에서 `whitederrick/logisticslink`로 변경
  - GitHub 저장소 `Settings > General > Repository name`
  - 변경 후 기존 `forwardlink` 이름을 다른 저장소에 재사용하지 않음
- [ ] 로컬 Git remote 변경

```bat
git remote set-url origin https://github.com/whitederrick/logisticslink.git
git remote -v
```

- [ ] 현재 변경사항을 커밋하고 원격 `main`에 push
- [ ] Codex 작업공간을 닫은 뒤 로컬 폴더명을 변경

```bat
cd /d C:\myProjects
ren forwardlink logisticslink
cd logisticslink
```

- [ ] Vercel 프로젝트명을 `logisticslink`로 변경
  - Vercel 프로젝트 `Settings > General > Project Name`
- [ ] Vercel Git 연결이 `whitederrick/logisticslink`와 `main`을 가리키는지 확인
  - 필요하면 `Settings > Git`에서 기존 연결을 갱신
- [ ] Vercel 기본 도메인과 사용자 도메인 확인
  - 프로젝트명 기반 `.vercel.app` 주소는 새 이름 기준으로 확인
  - 기존 운영 주소는 전환 기간 동안 유지하거나 새 주소로 redirect
- [ ] Vercel Production/Preview 환경의 `NEXTAUTH_URL`을 최종 HTTPS 주소로 변경
- [ ] 환경변수 변경 후 새 Production Deployment 실행
  - Vercel 환경변수 변경은 기존 deployment에 소급 적용되지 않음
- [ ] 배포된 `/api/health`에서 아래 값 확인
  - `platform: LogisticsLink`
  - `service: logisticslink-ocean`

## 출시 판단

- 내부 PoC/시연: 가능
- 제한된 파일럿: 조건부 가능
- 외부 고객 정식 출시: 아직 필요 작업 있음

## 완료

- 역할별 화면: 화주, 포워더, 선사, 관리자
- 로그인/로그아웃 및 HttpOnly 세션 쿠키
- 기업 회원가입 및 관리자 승인/제한/정지
- 비활성 일반 계정의 견적/풀/입찰 API 차단
- 견적 생성, 공동구매 풀, 역경매, 낙찰, 운송 후속 관리
- 관리자 운임 기준 등록/수정/삭제/import/sync
- 공개/파트너/유료/내부 운임 기준 비교 구조
- 운영 감사 로그 기록
- 감사 로그 요약/상세/필터 UI
- `next build` 및 도메인 테스트 통과

## 출시 전 필수

- 운영 PostgreSQL 준비 및 백업 정책 수립
- 운영 도메인/HTTPS 적용
- 운영 환경변수 설정
  - `DATABASE_URL`
  - `AUTH_SECRET` 또는 `NEXTAUTH_SECRET`
  - `AUTH_COOKIE_SECURE=true`
  - `CRON_SECRET`
  - `ALLOW_CRON_SECRET_QUERY=false`
  - `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false`
  - `RATE_BENCHMARK_CSV_SOURCES`
  - 실제 값 주입 후 `npm run env:check` 통과
- 데모 계정/seed 데이터와 운영 데이터 분리
- 실제 SCFI/선사 FAK/공시 운임 CSV 또는 사내 파일 경로 연결
  - `SCFI=https://...`
  - `CARRIER_FAK=https://...`
  - `CARRIER_PUBLIC_TARIFF=https://...`
  - 실제 값 주입 후 `npm run rate-sources:check` 통과
- cron 실행 환경 연결
  - `GET /api/cron/time-lock`
  - `GET /api/cron/rate-benchmarks`
  - production에서는 `Authorization: Bearer <CRON_SECRET>` 사용
- 전체 역할 브라우저 QA
  - `/signup`
  - `/login`
  - `/shipper`
  - `/forwarder`
  - `/carrier`
  - `/admin`
- 모바일/데스크톱 화면 확인

## 위험 및 보강 필요

- 비밀번호 재설정 기능 없음
- 이메일 인증/회사 서류 검증 없음
- 운영 알림 채널 없음
- 운임 CSV sync 실패 외부 알림 채널 없음
- 첨부파일/운송 문서 관리 없음
- 정산/청구 연계 없음

## 이번 출시 준비 보강

- production에서 인증 secret fallback 제거
  - `AUTH_SECRET` 또는 `NEXTAUTH_SECRET`이 없으면 세션 생성/검증 시 실패
- cron query secret을 production에서 기본 비활성화
  - `ALLOW_CRON_SECRET_QUERY=true`일 때만 query string secret 허용
  - 기본 권장 방식은 `Authorization: Bearer <CRON_SECRET>`
- 데모 로그인 UI를 환경변수로 숨길 수 있게 변경
  - `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false`
- 비활성 계정 UX 개선
  - 승인 대기/제한/정지 상태에서 역할별 작업 화면 대신 계정 상태 안내 표시
  - 사용자가 버튼을 누른 뒤 API 오류를 보는 흐름을 줄임
- 운영 환경 템플릿 추가
  - `.env.production.example`
  - 운영 기본값: HTTPS cookie, cron bearer token, demo login hidden
- 운영 환경변수 검증 스크립트 추가
  - `npm run env:check`
  - placeholder secret, insecure URL/cookie, cron query secret 허용, 데모 로그인 노출, 잘못된 운임 CSV URL 차단
- 운임 CSV 연결 검증 스크립트 추가
  - `npm run rate-sources:check`
  - SCFI/선사 FAK/공시 운임 CSV fetch 및 파싱 검증
- 운임 CSV sync 실패 감사 로그 보강
  - admin/cron sync 실패 시 `RATE_BENCHMARK_SYNC_FAILED` 기록
  - 감사 로그 요약에 실패 소스 라벨과 실패 건수 표시
