# ForwardLink 개발용 PRD

문서 버전: v1.0  
작성 기준: ForwardLink 기획서 Version 1.0, 2.0, 3.0, 4.0, 6.0 통합  
작성일: 2026-05-26  
제품명: ForwardLink  
도메인 후보: forward-link.co.kr  

## 1. 제품 정의

### 1.1 한 줄 정의

ForwardLink는 중소형 화주와 포워더의 파편화된 국제운송 물량을 공동구매 풀로 묶고, 선사의 역경매 입찰을 통해 더 나은 운임을 확보하는 공동구매형 디지털 포워딩 플랫폼이다.

### 1.2 핵심 컨셉

기존 디지털 포워딩 플랫폼이 개별 화주의 견적 요청, 부킹, 추적, 정산을 온라인화하는 데 초점을 둔다면, ForwardLink는 개별 물량을 그대로 처리하지 않고 다음 흐름을 중심으로 설계한다.

1. 화주 또는 포워더가 운임 견적을 요청한다.
2. 시스템이 동일 또는 유사 조건의 진행 중인 공동구매 풀을 찾는다.
3. 조건이 맞으면 기존 공동구매 참여를 추천한다.
4. 조건이 맞지 않으면 단독 견적을 유지하거나 신규 공동구매 풀을 생성한다.
5. 공동구매 풀은 D-14에 수요 모집을 마감한다.
6. D-14부터 D-7까지 선사가 역경매 방식으로 운임을 입찰한다.
7. D-7에 최저가 또는 운영자가 정한 낙찰 기준에 따라 운임을 확정한다.
8. 참여 화주와 포워더에게 확정 운임과 후속 진행 상태를 알린다.

### 1.3 제품 목표

ForwardLink의 1차 목표는 모든 국제운송 기능을 한 번에 구현하는 것이 아니라, 공동구매형 운임 매칭과 선사 역경매라는 차별화 구조가 실제 서비스로 작동함을 검증하는 것이다.

MVP의 성공 기준은 다음과 같다.

- 화주가 해상 FCL/LCL 견적 요청을 생성할 수 있다.
- 시스템이 진행 중인 공동구매 풀을 조건 기반으로 추천할 수 있다.
- 화주가 기존 공동구매에 참여하거나 신규 공동구매를 만들 수 있다.
- 공동구매 풀의 상태가 모집중, 경매중, 완료, 유찰로 전환될 수 있다.
- 선사가 경매중인 풀에 입찰할 수 있다.
- 관리자 또는 시스템이 낙찰과 유찰을 처리할 수 있다.
- 참여자별 세부 정보는 권한에 따라 숨겨지고, 선사와 참여자에게 필요한 집계 정보만 노출된다.

### 1.4 비목표

MVP에서 다음 기능은 구현하지 않는다. 데이터 구조는 확장 가능하게 설계하되, 실제 운영 기능은 후속 단계로 둔다.

- 외부 SCFI API 실시간 연동
- 외부 선사 스케줄 API 연동
- AIS 기반 선박 위치 추적
- 실제 결제/에스크로/카드 승인
- 실제 이메일 OTP 발송
- AI 기반 이상거래 탐지
- AI 기반 신용평가 모델 학습
- HS Code 기반 제재 품목 자동 판정
- 다통화 실시간 환율 청구
- 모바일 앱

MVP에서는 위 기능을 실제 외부 연동 대신 관리자 입력값, 목업 데이터, 내부 계산 로직으로 대체한다.

## 2. 개발 단계 구분

### 2.1 Phase 0: 프로젝트 기반 구축

목표: 개발을 시작할 수 있는 기본 앱 구조, 권한 구조, 데이터베이스 구조, 화면 레이아웃을 만든다.

포함 범위:

- 웹 애플리케이션 기본 구조
- 사용자 역할 정의
- 인증 화면 목업 또는 기본 로그인
- 데이터베이스 스키마 초안
- 공통 레이아웃
- 관리자 계정 시드 데이터
- 마스터 코드 데이터

완료 기준:

- 로컬 개발 서버가 실행된다.
- 관리자, 화주, 포워더, 선사 역할의 테스트 계정으로 로그인할 수 있다.
- 역할별 접근 가능한 메뉴가 다르게 보인다.
- 기본 마스터 데이터가 화면에서 선택 가능하다.

### 2.2 Phase 1: MVP Core

목표: ForwardLink의 핵심 차별화인 공동구매 매칭과 선사 역경매가 작동하는 최소 제품을 만든다.

포함 범위:

- 화주/포워더 회원가입 및 프로필
- 해상 FCL/LCL 견적 요청
- 조건 기반 공동구매 풀 추천
- 기존 풀 참여
- 신규 공동구매 생성
- 공동구매 현황 대시보드
- 선사 입찰 화면
- 관리자 낙찰/유찰 처리
- 블라인드 데이터 노출 정책
- 기본 알림 로그

완료 기준:

- 화주가 견적 요청을 생성하면 매칭 가능한 공동구매 풀이 추천된다.
- 화주가 추천 풀에 참여하면 총 물량이 갱신된다.
- D-14 이전 공동구매는 모집중 상태로 유지된다.
- 관리자가 수동으로 경매 전환을 실행하거나 스케줄러가 상태를 경매중으로 변경한다.
- 선사가 기준 운임보다 낮은 가격으로 입찰할 수 있다.
- 경매 종료 후 낙찰 또는 유찰 상태가 기록된다.

### 2.3 Phase 2: 운영 베타

목표: 실제 영업/운영자가 사용할 수 있도록 운영 기능과 검증 로직을 강화한다.

포함 범위:

- 사업자 정보 승인 워크플로우
- 명함/사업자등록증 파일 업로드
- 관리자 사용자 승인/반려
- 운임표 수동 등록
- 선사 운임표 업데이트 이력
- 선사 운임표 미갱신 제재 로직
- Trust Score 규칙 기반 점수 증감
- 보증금 필요 여부 계산
- 입찰 이력 및 감사 로그
- 알림 템플릿

완료 기준:

- 관리자가 신규 가입 기업을 승인해야 공동구매 참여가 가능하다.
- 선사가 구간별 기준 운임표를 등록할 수 있다.
- 일정 기간 운임표를 업데이트하지 않은 선사는 입찰 제한 상태가 된다.
- 사용자 취소/정산 지연/선적 완료 이벤트에 따라 Trust Score가 변한다.
- 점수에 따라 보증금 필요 여부와 참여 제한 여부가 계산된다.

### 2.4 Phase 3: 정산 및 실행 자동화

목표: 공동구매와 낙찰 이후의 정산, 부대비용, 문서, 실행 상태 관리를 붙인다.

포함 범위:

- 낙찰 운임 기반 정산서 생성
- Local Charges 항목 관리
- 부대비용 템플릿
- 화주별 예상 청구 금액 계산
- 부킹 요청 상태
- 선적 진행 상태
- 문서 업로드
- 정산 상태
- 보증금 결제 연동 준비

완료 기준:

- 공동구매 낙찰 후 참여자별 예상 청구 금액이 생성된다.
- 관리자가 부대비용을 추가하고 참여자별 배부 기준을 설정할 수 있다.
- 참여자는 본인 정산서만 볼 수 있다.
- 공동구매는 낙찰 이후 선적진행중, 완료 상태로 전환될 수 있다.

### 2.5 Phase 4: 글로벌 확장

목표: 다국가, 다통화, 글로벌 포트 코드, 시간대 처리를 정식으로 구현한다.

포함 범위:

- UN/LOCODE 기반 항구 마스터 확장
- POL 로컬 시간 기준 D-14/D-7 계산
- UTC 저장 및 로컬 시간 표시
- 다통화 환율 테이블
- USD 기준 선사 입찰
- 화주 국가별 통화 표시
- FX Buffer 계산
- 다국어 UI 구조
- HS Code 입력
- 위험물/냉장/제재 품목 공동구매 분리 규칙

완료 기준:

- 같은 ETD라도 출발항 시간대에 따라 경매 마감 UTC 시간이 정확히 계산된다.
- 선사 입찰 운임은 USD로 저장된다.
- 화주 화면에서는 국가별 통화로 환산 금액이 표시된다.
- 위험물, 냉장, 특수 품목은 일반 Dry 풀과 섞이지 않는다.

### 2.6 Phase 5: 외부 연동 및 고도화

목표: 실제 물류 운영 데이터와 AI 고도화 기능을 붙인다.

포함 범위:

- SCFI 또는 운임 지표 API 연동
- 은행/환율 API 연동
- 이메일/SMS/카카오/모바일 푸시 연동
- 선사 스케줄 API 연동
- 컨테이너 트래킹 API 연동
- AIS 지도 연동
- AI 이상거래 탐지
- AI 수요 예측
- AI 운임 가이드
- 금융/보험 상품 연계

완료 기준:

- 외부 운임 지표가 정기적으로 갱신된다.
- 시스템이 운임 기준가를 자동 산정한다.
- 경매 참여 패턴 이상 징후를 운영자에게 경고한다.
- 선적 이후 추적 정보가 자동으로 갱신된다.

## 3. 사용자와 권한

### 3.1 역할

#### Shipper

일반 화주. 화물을 보유하고 직접 견적 요청, 공동구매 생성, 공동구매 참여를 수행한다.

MVP 권한:

- 회원가입
- 프로필 입력
- 견적 요청 생성
- 공동구매 추천 조회
- 공동구매 참여
- 신규 공동구매 생성
- 본인 견적/공동구매 현황 조회

제한:

- 타 화주의 회사명, 사업자번호, 개별 물량, 개별 단가 조회 불가
- 선사 입찰가 전체 이력 조회 불가
- 낙찰 전 선사 상세 조건 일부 조회 제한 가능

#### Forwarder

포워더. 자기 보유 물량 또는 고객 물량을 기반으로 화주와 유사하게 견적 요청과 공동구매 참여를 수행한다.

MVP 권한:

- 화주와 동일한 견적/공동구매 기능
- 포워더 역할 표시
- 멤버십 등급 저장

Phase 2 이후 권한:

- 멤버십 등급별 기능 제한
- 물량 기반 포워딩 비딩 개설 또는 참여
- 상위 멤버십만 특정 공동구매 기능 사용

#### Carrier

선사. 모집이 마감되어 경매중 상태가 된 공동구매 풀에 대해 운임을 투찰한다.

MVP 권한:

- 경매중 공동구매 목록 조회
- 총 물량, 구간, 물성, 스케줄 조회
- 입찰가 제출
- 본인 입찰 이력 조회
- 최저가 갱신 알림 조회

제한:

- 낙찰 전 화주/포워더의 회사명과 개별 물량 조회 불가
- 모집중 상태의 풀에는 입찰 불가
- 기준가 이상 입찰 불가. 단 limit_override가 true면 허용

#### Admin

플랫폼 운영자.

MVP 권한:

- 모든 사용자 조회
- 공동구매 풀 조회
- 상태 수동 변경
- 기준 운임 입력
- limit_override 설정
- 낙찰/유찰 처리
- 알림 로그 조회

Phase 2 이후 권한:

- 기업 인증 승인/반려
- 운임표 업데이트 검수
- 제재 상태 관리
- Trust Score 조정
- 감사 로그 조회

### 3.2 사용자 상태

사용자 계정은 다음 상태를 가진다.

- PENDING_PROFILE: 가입은 되었으나 추가 정보 미입력
- PENDING_APPROVAL: 추가 정보 입력 완료, 관리자 승인 대기
- ACTIVE: 정상 사용 가능
- RESTRICTED: 일부 기능 제한
- LOCKED: 공동구매 생성/참여 제한
- SUSPENDED: 로그인 또는 거래 제한

MVP에서는 PENDING_PROFILE, ACTIVE, LOCKED만 구현해도 된다.

## 4. 핵심 업무 흐름

### 4.1 회원가입 흐름

1. 사용자가 역할을 선택한다.
2. 소속 국가 또는 지역을 선택한다.
3. 사업자 번호를 입력한다.
4. 이메일을 입력한다.
5. 이메일 중복 여부를 확인한다.
6. 약관에 동의한다.
7. ID, 비밀번호, 이름, 회사명, 업종, 월 예상 물류비, 물류 모드를 입력한다.
8. 가입이 완료된다.
9. MVP에서는 바로 ACTIVE 처리하거나 관리자 승인 대기 상태로 저장한다.

MVP 간소화:

- 이메일 OTP는 실제 발송하지 않고 인증 완료 플래그로 대체한다.
- 약관 스크롤 최하단 강제 로직은 프론트엔드 상태값으로 구현한다.
- 명함/사업자등록증 업로드는 Phase 2에서 정식 구현한다.

### 4.2 견적 요청 및 공동구매 추천 흐름

1. 화주 또는 포워더가 견적 요청 화면에 진입한다.
2. 운송 모드를 선택한다. MVP는 OCEAN_FCL, OCEAN_LCL만 지원한다.
3. 출발항 POL, 도착항 POD를 선택한다.
4. 희망 선적일 ETD를 입력한다.
5. 화물 타입과 컨테이너 정보를 입력한다.
6. 시스템이 기본 기준 운임을 계산하거나 관리자 입력 기준 운임을 조회한다.
7. 사용자가 견적 제출 전 추천 조회를 실행한다.
8. 시스템은 활성 공동구매 풀 중 매칭 가능한 풀을 검색한다.
9. 추천 결과가 있으면 공동구매 참여 팝업을 표시한다.
10. 사용자는 기존 풀 참여, 신규 풀 생성, 단독 견적 유지를 선택한다.

### 4.3 공동구매 매칭 규칙

MVP의 매칭은 AI 모델이 아니라 명시적 규칙 기반으로 구현한다. 이후 AI 추천 엔진으로 대체할 수 있도록 서비스 레이어를 분리한다.

필수 매칭 조건:

- pool.status = AGGREGATING
- pool.pol_code = quote.pol_code
- pool.pod_code = quote.pod_code
- pool.cargo_type = quote.cargo_type
- pool.container_type = quote.container_type
- quote.target_etd가 pool.target_etd 기준 -3일에서 +3일 사이
- 사용자 상태가 ACTIVE

선택 매칭 조건:

- 위험물 여부가 동일해야 한다.
- 냉장 여부가 동일해야 한다.
- 중량 화물 여부가 동일해야 한다.
- LCL의 경우 CBM 기준 잔여 용량 또는 결합 가능 기준을 적용한다.

추천 점수 예시:

- 구간 일치: 40점
- 화물/컨테이너 일치: 30점
- ETD 차이 0일: 20점
- ETD 차이 1일: 15점
- ETD 차이 2일: 10점
- ETD 차이 3일: 5점
- 물량 결합 효율: 최대 10점

추천 노출 기준:

- MVP에서는 필수 매칭 조건을 모두 만족하면 추천한다.
- Phase 2부터 추천 점수 85점 이상만 우선 추천한다.

### 4.4 공동구매 생성 흐름

1. 사용자가 추천 풀에 참여하지 않거나 추천 결과가 없다.
2. 사용자가 신규 공동구매 생성을 선택한다.
3. 기존 견적 입력값을 기반으로 공동구매 생성 폼을 자동 채운다.
4. 시스템이 auction_start_utc와 auction_end_utc를 계산한다.
5. 기준 운임 scfi_base_rate_usd를 설정한다.
6. 공동구매 상태를 AGGREGATING으로 저장한다.
7. 생성자는 자동으로 참여자로 등록된다.

MVP에서는 시간대 계산을 Asia/Seoul 기준으로 처리해도 된다. Phase 4에서 POL 로컬 시간대 기준으로 확장한다.

### 4.5 공동구매 참여 흐름

1. 사용자가 추천 풀에서 참여 버튼을 누른다.
2. 시스템이 사용자 상태, Trust Score, 풀 상태를 검증한다.
3. 시스템이 이미 참여한 사용자인지 확인한다.
4. 이미 참여한 경우 물량을 수정하거나 추가 물량으로 합산한다.
5. 신규 참여인 경우 PoolParticipants 레코드를 생성한다.
6. pool.total_volume_teu 또는 total_volume_cbm을 갱신한다.
7. 알림 로그를 생성한다.

참여 제한:

- pool.status가 AGGREGATING이 아니면 참여 불가
- 현재 시점이 auction_start_utc 이후면 참여 불가
- user.status가 LOCKED 또는 SUSPENDED이면 참여 불가
- Trust Score가 70 미만이면 참여 불가

### 4.6 D-14 경매 전환 흐름

1. 스케줄러가 일정 주기로 AGGREGATING 상태의 공동구매를 조회한다.
2. now >= auction_start_utc인 풀을 찾는다.
3. 해당 풀의 상태를 AUCTION으로 변경한다.
4. 참여자 추가를 차단한다.
5. 선사에게 입찰 가능 알림을 생성한다.

MVP에서는 관리자 버튼으로 경매 전환을 먼저 구현하고, 이후 스케줄러를 붙인다.

### 4.7 선사 입찰 흐름

1. 선사가 입찰 센터에 접속한다.
2. AUCTION 상태의 공동구매 목록을 조회한다.
3. 선사는 총 물량, 구간, 화물 타입, 목표 ETD, 경매 종료일, 기준 운임을 확인한다.
4. 선사가 입찰가를 입력한다.
5. 시스템이 입찰 유효성을 검증한다.
6. 유효하면 AuctionBids에 저장한다.
7. 현재 최저가가 갱신되면 기존 입찰 선사에게 알림 로그를 생성한다.

입찰 유효성:

- 사용자 역할이 CARRIER여야 한다.
- 사용자 상태가 ACTIVE여야 한다.
- 풀 상태가 AUCTION이어야 한다.
- now가 auction_start_utc 이상 auction_end_utc 이하이어야 한다.
- proposed_rate_usd > 0이어야 한다.
- limit_override가 false이면 proposed_rate_usd < scfi_base_rate_usd여야 한다.
- 동일 선사가 여러 번 입찰할 수 있다. 단 최신 입찰과 최저 입찰은 별도로 계산한다.

### 4.8 D-7 낙찰/유찰 흐름

1. 스케줄러 또는 관리자가 경매 종료 대상 풀을 조회한다.
2. now >= auction_end_utc인 AUCTION 상태 풀을 찾는다.
3. 입찰이 하나 이상 있으면 최저가 입찰을 찾는다.
4. winning_carrier_id와 final_rate_usd를 저장한다.
5. pool.status를 AWARDED 또는 COMPLETED로 변경한다.
6. 참여자에게 낙찰 알림을 생성한다.
7. 입찰이 없으면 pool.status를 FAILED로 변경한다.
8. 참여자에게 유찰 알림을 생성한다.
9. 유찰 건은 단독 견적 또는 운영자 수동 견적으로 전환할 수 있다.

상태명은 개발 구현 시 다음 중 하나로 통일한다.

- AGGREGATING
- AUCTION
- AWARDED
- FAILED
- SHIPMENT_IN_PROGRESS
- COMPLETED
- CANCELLED

MVP에서는 AGGREGATING, AUCTION, AWARDED, FAILED만 필수 구현한다.

## 5. 화면 요구사항

### 5.1 공통 화면

#### 로그인

필드:

- 이메일 또는 ID
- 비밀번호

동작:

- 로그인 성공 시 역할별 대시보드로 이동
- 실패 시 오류 표시

#### 회원가입

필드:

- 역할
- 소속 국가 또는 지역
- 사업자 번호
- 이메일
- ID
- 비밀번호
- 비밀번호 확인
- 국문 성명
- 영문 성명
- 휴대폰 번호
- 회사명 국문
- 회사명 영문
- 업종
- 이커머스 판매 여부
- 월 예상 물류비 또는 월 예상 매출
- 주요 물류 모드
- 약관 동의

### 5.2 화주/포워더 대시보드

표시 항목:

- 진행 중 견적 수
- 참여 중 공동구매 수
- 경매중 공동구매 수
- 낙찰 완료 건수
- Trust Score
- 최근 알림

주요 버튼:

- 새 견적 요청
- 공동구매 목록
- 내 요청 현황

### 5.3 견적 요청 화면

필드:

- 운송 모드: OCEAN_FCL, OCEAN_LCL
- POL
- POD
- 희망 ETD
- cargo_type
- container_type
- quantity
- weight_ton
- package_type
- width
- length
- height
- unit_system
- cargo_description
- hazardous 여부
- reefer 여부

동작:

- FCL 선택 시 컨테이너 타입과 수량 중심 입력
- LCL 선택 시 패키지와 CBM 계산 중심 입력
- 무게 기준 Heavy Cargo Flag 자동 계산
- 제출 전 공동구매 추천 조회
- 추천 결과에서 기존 풀 참여 또는 신규 생성 선택

### 5.4 공동구매 상세 화면

화주/포워더에게 보이는 정보:

- 공동구매 ID
- 상태
- POL/POD
- 목표 ETD
- 내 물량
- 총 누적 물량
- 모집 마감일
- 경매 종료일
- 예상 기준 운임
- 낙찰 운임. 낙찰 이후에만 표시

숨김 정보:

- 다른 참여자 회사명
- 다른 참여자 사업자 번호
- 다른 참여자 개별 물량
- 다른 참여자의 개별 견적 단가

### 5.5 선사 입찰 센터

목록 정보:

- 공동구매 ID
- POL/POD
- 목표 ETD
- 총 물량
- 화물 타입
- 기준 운임
- 경매 종료까지 남은 시간
- 현재 내 최저 입찰가
- 현재 최저가 여부

상세 정보:

- 총 TEU 또는 CBM
- 컨테이너 타입
- 위험물 여부
- 냉장 여부
- 중량 화물 여부
- 스케줄 요구사항
- 입찰 입력 필드

선사에게 숨김 처리:

- 화주/포워더 회사명
- 개별 참여자 리스트
- 개별 물량
- 사업자 정보

### 5.6 관리자 화면

필수 메뉴:

- 사용자 관리
- 공동구매 관리
- 견적 요청 관리
- 입찰 관리
- 기준 운임 관리
- 알림 로그

Phase 2 이후 메뉴:

- 기업 승인 관리
- 운임표 업데이트 관리
- Trust Score 관리
- 제재 관리
- 정산 관리

## 6. 데이터 모델

### 6.1 핵심 엔터티

#### users

사용자 계정과 역할 정보를 저장한다.

필드:

- id
- email
- username
- password_hash
- role
- status
- company_name_kr
- company_name_en
- company_region
- business_number
- phone
- name_kr
- name_en
- business_type
- ecommerce_status
- monthly_logistics_budget
- logistics_modes
- trust_score
- membership_level
- created_at
- updated_at

제약:

- email unique
- username unique
- role in SHIPPER, FORWARDER, CARRIER, ADMIN
- trust_score 기본값 100

#### ports

항구 마스터.

MVP 필드:

- code
- name
- country_code
- timezone

초기 시드:

- KRPUS: Busan, KR, Asia/Seoul
- KRINC: Incheon, KR, Asia/Seoul
- CNSHA: Shanghai, CN, Asia/Shanghai
- USLAX: Los Angeles, US, America/Los_Angeles
- USLGB: Long Beach, US, America/Los_Angeles
- VNSGN: Ho Chi Minh City, VN, Asia/Ho_Chi_Minh

#### quotes

개별 견적 요청.

필드:

- id
- requester_id
- requester_role
- mode
- pol_code
- pod_code
- target_etd
- cargo_type
- container_type
- quantity
- weight_ton
- volume_cbm
- package_type
- unit_system
- is_heavy
- is_hazardous
- is_reefer
- cargo_description
- guide_rate_usd
- status
- created_at
- updated_at

상태:

- DRAFT
- SUBMITTED
- MATCHED_TO_POOL
- STANDALONE
- CANCELLED

#### co_buy_pools

공동구매 풀.

필드:

- id
- created_by
- pol_code
- pod_code
- target_etd
- cargo_type
- container_type
- is_hazardous
- is_reefer
- is_heavy
- total_volume_teu
- total_volume_cbm
- total_weight_ton
- status
- auction_start_utc
- auction_end_utc
- scfi_base_rate_usd
- final_rate_usd
- winning_carrier_id
- limit_override
- created_at
- updated_at

#### pool_participants

공동구매 참여자별 물량.

필드:

- id
- pool_id
- user_id
- quote_id
- role
- volume_teu
- volume_cbm
- weight_ton
- deposit_required
- deposit_amount
- status
- joined_at
- cancelled_at

상태:

- JOINED
- CANCELLED
- CONFIRMED
- NO_SHOW

#### auction_bids

선사 입찰 로그.

필드:

- id
- pool_id
- carrier_id
- proposed_rate_usd
- bid_time
- is_winning_at_time

#### notifications

알림 로그.

필드:

- id
- user_id
- type
- title
- message
- related_entity_type
- related_entity_id
- read_at
- created_at

#### audit_logs

중요한 상태 변경 로그.

필드:

- id
- actor_id
- action
- entity_type
- entity_id
- before_json
- after_json
- created_at

### 6.2 Phase 2 이후 엔터티

#### carrier_rate_sheets

선사 운임표 업데이트 이력.

필드:

- id
- carrier_id
- pol_code
- pod_code
- cargo_type
- rate_usd
- effective_from
- effective_to
- uploaded_at

#### trust_score_events

Trust Score 증감 이력.

필드:

- id
- user_id
- event_type
- score_delta
- reason
- related_entity_type
- related_entity_id
- created_at

#### settlements

정산서.

필드:

- id
- pool_id
- participant_id
- base_freight_usd
- local_charges_amount
- local_charges_currency
- fx_rate
- fx_buffer_rate
- total_billing_amount
- billing_currency
- status
- issued_at
- paid_at

## 7. API 요구사항

### 7.1 인증

#### POST /api/auth/register

목적: 사용자 회원가입

요청:

```json
{
  "role": "SHIPPER",
  "email": "shipper@example.com",
  "username": "shipper01",
  "password": "Password!123",
  "companyRegion": "KOREA, REPUBLIC OF",
  "businessNumber": "123-45-67890",
  "companyNameKr": "테스트화주",
  "companyNameEn": "Test Shipper",
  "businessType": "전기/전자",
  "logisticsModes": ["OCEAN"]
}
```

응답:

```json
{
  "userId": 1,
  "status": "ACTIVE"
}
```

#### POST /api/auth/login

목적: 로그인

응답:

```json
{
  "accessToken": "token",
  "user": {
    "id": 1,
    "role": "SHIPPER",
    "status": "ACTIVE"
  }
}
```

### 7.2 견적

#### POST /api/quotes

목적: 견적 요청 생성

요청:

```json
{
  "mode": "OCEAN_FCL",
  "polCode": "KRPUS",
  "podCode": "USLAX",
  "targetEtd": "2026-07-01",
  "cargoType": "FCL_DRY",
  "containerType": "40FT_DRY",
  "quantity": 2,
  "weightTon": 18,
  "isHazardous": false,
  "isReefer": false
}
```

응답:

```json
{
  "quoteId": 1001,
  "isHeavy": false,
  "guideRateUsd": 3200
}
```

#### GET /api/quotes/:id/recommended-pools

목적: 견적 조건에 맞는 공동구매 풀 추천

응답:

```json
{
  "quoteId": 1001,
  "recommendedPools": [
    {
      "poolId": 501,
      "polCode": "KRPUS",
      "podCode": "USLAX",
      "targetEtd": "2026-07-02",
      "currentTotalVolumeTeu": 42,
      "daysUntilClose": 4,
      "matchScore": 95,
      "expectedDiscountRate": 18.5
    }
  ]
}
```

### 7.3 공동구매

#### POST /api/pools

목적: 신규 공동구매 생성

요청:

```json
{
  "quoteId": 1001,
  "scfiBaseRateUsd": 3200
}
```

응답:

```json
{
  "poolId": 501,
  "status": "AGGREGATING",
  "auctionStartUtc": "2026-06-17T00:00:00.000Z",
  "auctionEndUtc": "2026-06-24T00:00:00.000Z"
}
```

#### POST /api/pools/:poolId/join

목적: 기존 공동구매 참여

요청:

```json
{
  "quoteId": 1001
}
```

응답:

```json
{
  "participantId": 9001,
  "poolId": 501,
  "status": "JOINED",
  "totalVolumeTeu": 44
}
```

#### GET /api/pools/:poolId

목적: 공동구매 상세 조회

권한별 응답:

- 화주/포워더: 본인 물량과 전체 집계 물량만 반환
- 선사: 총 물량, 구간, 스케줄, 기준 운임만 반환
- 관리자: 전체 반환

### 7.4 경매

#### GET /api/carrier/auctions

목적: 선사가 입찰 가능한 공동구매 목록 조회

조건:

- status = AUCTION
- now between auction_start_utc and auction_end_utc
- carrier status = ACTIVE

#### POST /api/auctions/:poolId/bids

목적: 선사 입찰

요청:

```json
{
  "proposedRateUsd": 2950
}
```

응답:

```json
{
  "bidId": 3001,
  "poolId": 501,
  "isCurrentLowest": true
}
```

오류:

- 403: CARRIER 역할이 아님
- 409: 경매 상태가 아님
- 422: 기준 운임보다 높거나 같은 입찰

### 7.5 관리자

#### POST /api/admin/pools/:poolId/start-auction

목적: 수동 경매 전환

#### POST /api/admin/pools/:poolId/close-auction

목적: 수동 낙찰/유찰 처리

#### PATCH /api/admin/pools/:poolId/limit-override

목적: 특수 시황으로 입찰 기준가 제한 해제

요청:

```json
{
  "limitOverride": true,
  "reason": "Market disruption"
}
```

## 8. 비즈니스 규칙

### 8.1 Heavy Cargo

FCL에서 다음 조건을 만족하면 is_heavy = true로 처리한다.

- 20 FT 컨테이너 기준 16톤 이상
- 40 FT 컨테이너 기준 20톤 이상

MVP에서는 is_heavy가 true인 화물은 is_heavy가 true인 공동구매 풀과만 매칭한다.

### 8.2 공동구매 상태 전환

허용되는 상태 전환:

- AGGREGATING -> AUCTION
- AGGREGATING -> CANCELLED
- AUCTION -> AWARDED
- AUCTION -> FAILED
- AWARDED -> SHIPMENT_IN_PROGRESS
- SHIPMENT_IN_PROGRESS -> COMPLETED

금지되는 상태 전환:

- AWARDED -> AGGREGATING
- FAILED -> AUCTION. 단 관리자가 재오픈 기능을 별도 구현하면 가능
- COMPLETED -> AUCTION

### 8.3 기준 운임

MVP 기준 운임:

- 관리자가 직접 입력한다.
- 또는 공동구매 생성 시 quote.guide_rate_usd를 복사한다.

Phase 5 기준 운임:

- SCFI 또는 외부 운임 지표를 연동한다.
- 플랫폼 내부 거래 데이터를 반영한다.
- 특수 시황 발생 시 limit_override를 자동 제안한다.

### 8.4 Trust Score

MVP:

- 사용자 생성 시 100점
- 70점 미만이면 공동구매 생성/참여 제한
- 점수 조정은 관리자 수동 처리

Phase 2:

- 낙찰 후 취소: -15
- 정산 지연: 일당 -2
- 선적 정상 완료: +2
- 95점 이상: 보증금 면제
- 80점 미만: 예상 운임 10% 보증금 필요
- 70점 미만: 공동구매 생성/참여 잠금

### 8.5 선사 운임표 업데이트 의무

Phase 2에서 구현한다.

규칙:

- 선사는 매주 또는 매월 구간별 운임표를 최소 3회 업데이트해야 한다.
- 업데이트 횟수가 기준 미달이면 다음 기간 공동구매 입찰 제한 대상으로 표시한다.
- 실제 제한 적용 여부는 관리자가 승인한다.

## 9. 마스터 데이터

### 9.1 국가/지역

초기 목록:

- AUSTRALIA
- BRAZIL
- CHILE
- China Mainland
- COLOMBIA
- EGYPT
- GERMANY
- HUNGARY
- INDIA
- KOREA, REPUBLIC OF
- MALAYSIA
- MEXICO
- NETHERLANDS
- PANAMA
- PERU
- PHILIPPINES
- POLAND
- SINGAPORE
- SLOVAKIA
- SWEDEN
- THAILAND
- TURKIYE
- UNITED ARAB EMIRATES
- UNITED STATES
- VIETNAM

### 9.2 업종

초기 목록:

- 가구/인테리어자재
- 산업장비
- 식음료/소비재
- 자동차부품
- 전기/전자
- 철강/금속
- 패션/악세서리
- 화장품미용
- 화학/제약
- 물류
- 기타

### 9.3 컨테이너 타입

FCL:

- 20FT_DRY
- 20FT_HIGH_CUBE
- 20FT_REEFER
- 20FT_HIGH_CUBE_REEFER
- 20FT_TANKER
- 20FT_DANGEROUS
- 22FT_TANKER
- 40FT_DRY
- 40FT_HIGH_CUBE
- 40FT_REEFER
- 40FT_HIGH_CUBE_REEFER
- 40FT_TANKER
- 45FT_HIGH_CUBE_REEFER

LCL/항공 패키지:

- BOX
- CARTON
- PALLET
- PIECE

## 10. 보안과 데이터 노출 정책

### 10.1 원칙

ForwardLink의 공동구매 구조에서는 정보 비대칭 설계가 핵심이다. 참여 물량은 모으되, 참여자의 신원과 개별 단가는 노출하지 않는다.

### 10.2 화주/포워더 화면 노출

노출 가능:

- 본인 물량
- 총 누적 물량
- 공동구매 상태
- 마감 일정
- 낙찰 후 최종 운임

노출 금지:

- 타 참여자 회사명
- 타 참여자 사업자 번호
- 타 참여자 개별 물량
- 타 참여자 개별 견적
- 선사의 전체 입찰 전략 정보

### 10.3 선사 화면 노출

노출 가능:

- 총 물량
- POL/POD
- 목표 ETD
- 화물 타입
- 위험물/냉장/중량 여부
- 기준 운임
- 경매 마감 시간

노출 금지:

- 참여 화주/포워더 회사명
- 개별 참여자 물량
- 사업자 번호
- 연락처

### 10.4 관리자 화면 노출

관리자는 운영상 전체 정보를 볼 수 있다. 단 주요 조회/변경은 audit_logs에 기록한다.

## 11. 알림 요구사항

MVP에서는 실제 이메일/문자 발송 대신 notifications 테이블에 알림을 생성하고 화면에 표시한다.

알림 유형:

- QUOTE_CREATED
- POOL_RECOMMENDED
- POOL_JOINED
- POOL_CREATED
- AUCTION_STARTED
- BID_PLACED
- LOWEST_BID_UPDATED
- AUCTION_AWARDED
- AUCTION_FAILED
- TRUST_SCORE_CHANGED

Phase 5에서 이메일, SMS, 모바일 푸시와 연결한다.

## 12. 비기능 요구사항

### 12.1 성능

MVP 목표:

- 공동구매 추천 조회는 1초 이내 응답
- 대시보드 목록은 2초 이내 응답
- 입찰 제출은 1초 이내 처리

### 12.2 감사 가능성

다음 이벤트는 반드시 로그로 남긴다.

- 사용자 가입
- 사용자 상태 변경
- 공동구매 생성
- 공동구매 참여
- 공동구매 상태 변경
- 입찰 제출
- 낙찰 처리
- 유찰 처리
- limit_override 변경
- Trust Score 변경

### 12.3 확장성

MVP에서도 다음 확장을 고려해 설계한다.

- 매칭 엔진은 독립 서비스 함수로 분리한다.
- 운임 기준가 계산은 provider 구조로 분리한다.
- 알림 발송은 adapter 구조로 분리한다.
- 시간대 계산은 유틸 함수로 분리한다.
- 권한별 응답 마스킹은 API 응답 계층에서 명확히 처리한다.

## 13. 개발 작업 순서

### Step 1: 프로젝트 초기화

작업:

- 웹 앱 프레임워크 선택
- DB 선택
- ORM 설정
- 환경 변수 구조 생성
- 기본 레이아웃 생성

권장:

- Next.js + TypeScript
- PostgreSQL
- Prisma
- Tailwind CSS

대안:

- FastAPI + PostgreSQL + React
- NestJS + PostgreSQL

### Step 2: 데이터 모델과 시드

작업:

- users
- ports
- quotes
- co_buy_pools
- pool_participants
- auction_bids
- notifications
- audit_logs
- master codes

완료 기준:

- DB 마이그레이션 성공
- 테스트 계정 생성
- 항구/국가/업종/컨테이너 타입 시드 생성

### Step 3: 인증과 역할별 레이아웃

작업:

- 회원가입
- 로그인
- 세션 관리
- 역할별 메뉴
- 접근 제어

완료 기준:

- Shipper, Forwarder, Carrier, Admin으로 로그인 가능
- 역할에 맞지 않는 페이지 접근 차단

### Step 4: 견적 요청

작업:

- 견적 생성 폼
- FCL/LCL 입력 분기
- CBM 계산
- Heavy Cargo 계산
- 견적 저장

완료 기준:

- 견적 요청이 DB에 저장된다.
- 사용자가 본인 견적 목록을 볼 수 있다.

### Step 5: 공동구매 추천과 생성

작업:

- 매칭 엔진 함수 구현
- 추천 API 구현
- 추천 팝업 UI 구현
- 신규 공동구매 생성
- 기존 공동구매 참여

완료 기준:

- 동일 구간/화물/ETD ±3일 조건의 공동구매가 추천된다.
- 참여 시 총 물량이 갱신된다.

### Step 6: 선사 역경매

작업:

- 경매 목록
- 입찰 상세
- 입찰 제출
- 기준 운임 검증
- 최저가 계산
- 입찰 알림

완료 기준:

- 선사가 경매중 풀에 입찰할 수 있다.
- 기준 운임 이상 입찰은 거절된다.
- limit_override가 true이면 기준 운임 이상도 허용된다.

### Step 7: 관리자 운영

작업:

- 공동구매 상태 관리
- 수동 경매 시작
- 수동 경매 종료
- 낙찰/유찰 처리
- 사용자 상태 관리
- 알림 로그 조회

완료 기준:

- 관리자가 MVP 운영 흐름 전체를 테스트할 수 있다.

### Step 8: 자동 스케줄러

작업:

- D-14 경매 시작 작업
- D-7 경매 종료 작업
- 알림 생성
- 실패 재시도 로그

완료 기준:

- 시간이 지난 공동구매가 자동으로 상태 전환된다.

### Step 9: 운영 베타 기능

작업:

- 기업 승인
- 파일 업로드
- 운임표 등록
- Trust Score 이벤트
- 보증금 필요 여부 계산

완료 기준:

- 운영자가 실제 사용자와 선사 관리를 할 수 있다.

## 14. MVP 인수 기준

MVP는 다음 시나리오가 모두 성공하면 완료로 본다.

### 시나리오 1: 화주 신규 공동구매 생성

1. 화주가 로그인한다.
2. FCL 40FT DRY, KRPUS -> USLAX, ETD 2026-07-01 견적을 생성한다.
3. 추천 풀이 없다는 결과가 나온다.
4. 화주가 신규 공동구매를 생성한다.
5. 공동구매 상태가 AGGREGATING으로 생성된다.
6. 화주는 내 공동구매 현황에서 해당 풀을 볼 수 있다.

### 시나리오 2: 다른 화주의 기존 풀 참여

1. 두 번째 화주가 유사 조건 견적을 생성한다.
2. 기존 공동구매가 추천된다.
3. 두 번째 화주가 참여한다.
4. 공동구매 총 물량이 증가한다.
5. 첫 번째 화주는 총 물량 증가만 볼 수 있고, 두 번째 화주 회사명은 볼 수 없다.

### 시나리오 3: 경매 전환

1. 관리자가 공동구매를 경매중으로 전환한다.
2. 상태가 AUCTION으로 변경된다.
3. 화주는 더 이상 해당 풀에 참여할 수 없다.
4. 선사 계정에서는 해당 풀이 입찰 가능 목록에 표시된다.

### 시나리오 4: 선사 입찰과 낙찰

1. 선사가 기준 운임보다 낮은 금액으로 입찰한다.
2. 입찰이 저장된다.
3. 다른 선사가 더 낮은 금액으로 입찰한다.
4. 최저가가 갱신된다.
5. 관리자가 경매를 종료한다.
6. 최저가 선사가 낙찰자로 저장된다.
7. 참여 화주에게 낙찰 알림이 생성된다.

### 시나리오 5: 유찰

1. 공동구매가 AUCTION 상태다.
2. 아무 선사도 입찰하지 않는다.
3. 관리자가 경매를 종료한다.
4. 상태가 FAILED로 변경된다.
5. 참여자에게 유찰 알림이 생성된다.

## 15. 남은 의사결정

개발 착수 전 확정하면 좋은 항목:

- 첫 기술 스택: Next.js 기반 단일 앱으로 갈지, 백엔드/프론트 분리로 갈지
- 실제 DB: PostgreSQL 로컬 설치, Docker, 또는 Supabase
- 인증 방식: 자체 이메일 로그인, NextAuth, Clerk 등
- MVP에서 관리자 승인 절차를 넣을지 여부
- MVP에서 실제 이메일 발송을 넣을지 여부
- SCFI 기준 운임을 수동 입력으로 시작할지, 샘플 테이블로 시작할지
- 공동구매 단위: 컨테이너 타입까지 완전 동일해야 하는지, 20FT/40FT 혼합 풀을 허용할지
- 선사 입찰가 공개 범위: 최저가만 공개할지, 참여 선사 목록과 가격을 모두 공개할지
- 유찰 시 자동 단독 견적 전환을 MVP에 넣을지, 관리자 수동 처리로 둘지

## 16. 추천 MVP 구현 방향

첫 개발은 다음 조합을 추천한다.

- Next.js + TypeScript 단일 애플리케이션
- PostgreSQL + Prisma
- Tailwind CSS
- 서버 액션 또는 API Routes
- 로컬 인증 또는 간단한 credentials 로그인
- 실제 외부 API 연동 없음
- 관리자 입력 기준 운임
- 수동 경매 전환 먼저 구현 후 스케줄러 추가

이 방식이 적합한 이유:

- 화면과 백엔드를 한 프로젝트에서 빠르게 개발할 수 있다.
- PRD 검증용 MVP를 빠르게 만들 수 있다.
- 데이터 모델을 PostgreSQL 기준으로 잡아 향후 운영 환경으로 옮기기 쉽다.
- 공동구매 매칭, 권한별 마스킹, 역경매라는 핵심 리스크를 먼저 검증할 수 있다.

## 17. 첫 번째 개발 스프린트 범위

Sprint 1 목표: 사용자가 로그인하고 역할별 화면을 볼 수 있으며, 견적 요청과 공동구매 생성까지 가능하게 만든다.

포함:

- 프로젝트 초기화
- DB 스키마
- 시드 데이터
- 로그인
- 역할별 대시보드
- 견적 요청 생성
- 공동구매 생성
- 내 공동구매 목록

제외:

- 선사 입찰
- 자동 스케줄러
- 정산
- 파일 업로드
- 외부 API

Sprint 1 완료 후 Sprint 2에서 선사 입찰과 낙찰/유찰을 붙인다.
