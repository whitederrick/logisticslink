# LogisticsLink 작업 인수인계 메모

작성일: 2026-05-31

## 현재 기준 상태

- main 최신 커밋 기준으로 시작: `2af9ae5 Clarify MVP entry flow`
- Vercel 최신 deployment는 `2af9ae5d...` 기준 `success`
- Vercel 배포 URL 직접 접근은 `401 Unauthorized`
  - 코드 오류가 아니라 Vercel Authentication / Deployment Protection 계열 접근 보호로 판단
- 로컬 검증:
  - 테스트 `17 passed`
  - `next build` 성공
  - `next start -p 3001` 기준 주요 화면 모두 `200`
    - `/`
    - `/dashboard`
    - `/login`
    - `/signup`
    - `/shipper`
    - `/forwarder`
    - `/carrier`
    - `/admin`

## 오늘 반영한 작업

### MVP scene 정리

MVP 흐름을 단순 기능 목록이 아니라 데모 장면(scene) 기준으로 정리했다.

현재 6개 장면:

1. 진입 제어
2. 화물 등록
3. 공동구매 집계
4. 타임락 경매
5. 낙찰 확정
6. 운송 후속

수정 파일:

- `src/app/page.tsx`
  - 첫 화면 카드를 기존 4단계에서 6개 MVP 장면으로 정리
- `src/app/dashboard/page.tsx`
  - “권장 MVP 시연 순서”를 “MVP 데모 장면”으로 변경
  - 각 장면에 역할, 작업 화면, 실제 액션, 확인 포인트를 표시
- `src/components/app-shell.tsx`
  - 내부 공통 “메인 비즈니스 절차”를 같은 6장면 흐름으로 정렬

### 런칭 앱 오류 대응

사용자 화면에 다음 오류가 반복 발생했다.

```text
Error launching app
Unable to find Electron app at C:\Program Files\WindowsApps\OpenAI.Co...#type=action&action=1...
Cannot find module 'C:\Program Files\WindowsApps\OpenAI.Co...#type=action&action=1...'
```

판단:

- LogisticsLink 앱 코드 오류가 아니다.
- OpenAI/Codex 데스크톱 앱의 내부 action/deeplink를 Windows가 Electron 앱 경로처럼 잘못 해석하는 문제로 보인다.
- `#type=action&action=...` URL fragment가 앱 경로에 붙어 Electron이 module을 못 찾고 있다.
- 이 스레드에서는 `Launch app` 버튼이나 브라우저 자동 실행을 더 건드리지 않는 것이 안전하다.

우회용으로 추가한 파일:

- `scripts/launch-dev.ps1`

사용법:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\launch-dev.ps1
```

그 다음 브라우저에서 직접 연다.

```text
http://localhost:3001
```

README에도 위 우회 방법을 추가했다.

## 주의할 점

- 이 환경에서는 `npm` 명령이 PATH에 없었다.
  - `npm run test`, `npm run build`는 바로 실행되지 않음
  - Codex 번들 Node로 직접 실행해서 검증했다.
- 번들 Node 경로:

```powershell
C:\Users\white\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe
```

테스트 실행:

```powershell
& 'C:\Users\white\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --import tsx --test src\lib\*.test.ts
```

빌드 실행:

```powershell
& 'C:\Users\white\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\next\dist\bin\next build
```

## 다음에 이어서 할 일

1. 사용자가 다시 오면 먼저 `git status --short` 확인
2. scene 정리 변경분 검토
3. 필요하면 커밋:
   - 후보 메시지: `Organize MVP demo scenes`
4. Vercel 접근 보호는 코드가 아니라 Vercel 설정에서 확인
   - Deployment Protection / Vercel Authentication
5. OpenAI/Codex 런칭 앱 오류는 앱 코드와 분리해서 볼 것
   - 필요 시 Windows 앱 설정에서 OpenAI/Codex Repair 또는 Reset
   - 계속되면 재설치 권장

## 현재 미커밋 변경 예상

- `README.md`
- `scripts/launch-dev.ps1`
- `src/app/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/components/app-shell.tsx`

