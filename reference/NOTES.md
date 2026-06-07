# NOTES — LogisticsLink 작업 메모

> 새 세션 시작 시, 이 파일 → `docs/` → git 순으로 보면 빠르게 컨텍스트가 잡힙니다.

---

## 프로젝트 개요

- **공식 명칭**: LogisticsLink (구 ForwardLink에서 리브랜딩)
- **컨셉**: 화주의 *운임 공동구매* + 선사의 *운임 경쟁 입찰* 기반 **통합 국제 운송 중개 플랫폼** (Platforest)
- **핵심 이해관계자**: 화주 / 포워더 / 선사
- **언어/지역**: 다국어(ko/en/zh/es/vi/de/pt/hu/pl/sk), 국가 25개국
- **로컬 포트**: 3001

## 현재 상태 (2026-06-07 기준)

- **브랜치**: `main` (origin/main 동기화)
- **HEAD**: `75241df fix(signup): auto-unlock terms agreement when content fits container`
- **진행 중 브랜치**:
  - `feat/signup-bootstrap-admin` — 첫 ADMIN 자동 부트스트랩 (미머지)

### 최근 커밋 흐름
1. `75241df` fix(signup): 약관 컨테이너 자동 언락
2. `60bae6e` feat(signup): 첫 ADMIN 부트스트랩
3. `d062324` Seed core ocean ports
4. `89e31a6` Rebrand platform as LogisticsLink
5. `2af9ae5` Clarify MVP entry flow
6. `221e478` Prepare ForwardLink MVP for Vercel deployment
7. `949c3bc` Stabilize dashboard workflow UI
8. `f0b2be7` Add dashboard auction workflow UI
9. `ed7221e` Add auction management APIs
10. `d1f9b17` Use port 3001 for local app

## reference/ 폴더의 레퍼런스 문서

| 파일 | 상태 | 비고 |
|---|---|---|
| `20240322_DFP_Process_v0.39.pptx` | **작성 중(WIP)** | 59슬라이드. 화면설계/ERD는 이미지 위주라 텍스트 추출 한계. |
| `_pptx_dump.txt` | 추출 결과 | `python _dump_pptx.py`로 재생성 가능 |
| `_dump_pptx.py` | 유틸 | python-pptx 기반 추출 스크립트 |

### PPT 핵심 요약 (v0.39, 미완)
- **비즈니스 모델**: 화주 무료/멤버십, 포워더 멤버십, 선사 가입비+낙찰 수수료
- **프로세스**: 회원가입 → 운임견적 → 공동구매/입찰 → 낙찰/유찰 알림
- **UML 시나리오**: 일반 견적 / 공동구매 신청 / 공동구매 추천 매칭
- **메뉴 구성**: ①~⑧ 카테고리, 다국어·다국가 셀렉트
- **주요 비즈니스 룰**:
  - 운임표 매주/매월 구간별 3회 미갱신 시 입찰 제한
  - D-7 미확정 시 견적 불가
  - 입찰 최저가 갱신 시 참여 선사 알림
  - LCL/항공은 박스·카톤·팔레트·피스 패키지 분류

## docs/ 폴더

| 문서 | 용도 |
|---|---|
| `HANDOFF_2026-06-07_BOOTSTRAP_AND_TERMS_FIX.md` | 최신 핸드오프 (부트스트랩 + 약관) |
| `CHAT_HANDOFF_2026-06-07.md` | 채팅 핸드오프 (최신) |
| `CHAT_HANDOFF_2026-06-05.md` | 채팅 핸드오프 |
| `ForwardLink_Development_PRD.md` | PRD (구 포워드링크) |
| `LOGISTICSLINK_ARCHITECTURE.md` | 아키텍처 |
| `LAUNCH_CHECKLIST.md` | 런치 체크리스트 |
| `WORK_HANDOFF_2026-05-28.md` | 5/28 핸드오프 |
| `WORK_HANDOFF_2026-05-31.md` | 5/31 핸드오프 |

## 결정/진행 중 항목

> **컨벤션**: 확정 = ✅, 진행 중 = 🟡, 미정 = ❓

- ✅ 리브랜딩: ForwardLink → LogisticsLink
- ✅ 로컬 포트: 3001
- 🟡 부트스트랩 ADMIN 자동화 (브랜치 `feat/signup-bootstrap-admin`)
- 🟡 약관 컨테이너 자동 언락 (HEAD 커밋)
- 🟡 MVP Vercel 배포 준비
- ❓ Platforest ↔ LogisticsLink 네이밍 통일 (현재 PPT는 Platforest, 코드는 LogisticsLink)
- ❓ 멤버십 3레벨 구체적 권한/가격 정의
- ❓ D-7 룰 / 3회 미갱신 룰의 실제 적용 시점/예외

## 다음 세션을 위한 팁

1. 세션 시작 시 **이 파일 먼저 읽기**
2. `docs/HANDOFF_2026-06-07_BOOTSTRAP_AND_TERMS_FIX.md` 확인
3. `git status` + `git log -10`로 작업 흐름 확인
4. 사용자가 명시 안 해도, 화면설계/ERD 같은 시각자료는 **원본 PPT/PDF** 직접 확인 권장
5. WIP 문서(`v0.39`)는 추측으로 채우지 말고 "비어있음"으로 두고 사용자에게 확인

## 환경 메모

- Python: 3.13, `python-pptx` 설치 완료
- LibreOffice/pandoc/unoconv: 미설치 (PPTX→PDF 변환 필요 시 별도 설치)
- Git Bash (MINGW64) 환경 — `chcp` 사용 불가, 인코딩 이슈 시 UTF-8 리다이렉트
